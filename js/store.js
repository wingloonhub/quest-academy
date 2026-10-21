/* store.js — single source of truth for player data.

   - One account can hold SEVERAL players (Netflix-style), each with their own
     assessment history across English, Bahasa and Maths
     (every session is tagged subject → topic → level).
   - Every change is written to localStorage first (works offline, nothing is
     lost if the tab closes), then synced to the cloud by firebase.js.
   - The cloud copy is MERGED, never blindly overwritten: sessions are combined
     by timestamp, deleted players / cleared histories are remembered with a
     timestamp, and the newest edit of a player's name wins. So a phone and a
     desktop signed in to the same account always end up with the same data. */
(function () {
  "use strict";
  const LS_PREFIX = "qa_save_";
  const HISTORY_MAX = 120;     // finished sessions kept per player (all subjects)
  const DETAIL_KEEP = 20;      // newest sessions that keep every question for "View details"
  const MISTAKES_MAX = 8;      // mistakes kept per session for the Parent Report

  let uidKey = "guest";
  let syncer = null;           // set by firebase.js
  let saveTimer = null;
  const listeners = [];

  const clone = (o) => JSON.parse(JSON.stringify(o == null ? null : o));
  const isObj = (o) => !!o && typeof o === "object" && !Array.isArray(o);

  function newProfileId() {
    return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }
  function cleanName(n) { return String(n == null ? "" : n).trim().slice(0, 24) || "Player"; }

  function blankProfile(name, gender) {
    const now = Date.now();
    return {
      id: newProfileId(),
      name: cleanName(name),
      gender: gender === "girl" ? "girl" : "boy",
      createdAt: now,
      updatedAt: now,          // last edit of name / character — newest edit wins on merge
      lastPlayed: now,
      history: [],             // finished sessions, newest first, all subjects
      cleared: {}              // { english: ts, all: ts } — sessions at/before ts are gone
    };
  }

  function blankState() {
    return {
      v: 1,
      account: { uid: null, email: null },
      profiles: {},
      deleted: {},             // { profileId: ts } so a deleted player stays deleted everywhere
      activeProfileId: null    // per device — never taken from the cloud
    };
  }

  // Same key on every device for the same finished session.
  function sessionKey(h) { return (h.subjectId || "?") + "|" + (h.topicId || "?") + "|" + (h.levelId || "?") + "|" + (h.ts || 0); }

  function isCleared(h, cleared) {
    const c = cleared || {};
    return (h.ts || 0) <= Math.max(c.all || 0, c[h.subjectId] || 0);
  }

  // De-duplicate, drop cleared sessions, newest first, cap the size.
  function tidyHistory(list, cleared) {
    const seen = {};
    const out = [];
    (list || []).forEach(function (h) {
      if (!isObj(h) || h.ts == null || isCleared(h, cleared)) return;
      const k = sessionKey(h);
      if (seen[k]) {
        if (!seen[k].answers && h.answers) seen[k].answers = h.answers;
        return;
      }
      seen[k] = h;
      out.push(h);
    });
    out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    const capped = out.slice(0, HISTORY_MAX);
    capped.forEach(function (h, i) { if (i >= DETAIL_KEEP && h.answers) delete h.answers; });
    return capped;
  }

  function maxMap(a, b) {
    const out = Object.assign({}, isObj(a) ? a : {});
    Object.keys(isObj(b) ? b : {}).forEach(function (k) { out[k] = Math.max(out[k] || 0, b[k] || 0); });
    return out;
  }

  function normaliseProfile(raw, pid) {
    const p = Object.assign({}, isObj(raw) ? raw : {});
    p.id = p.id || pid;
    p.name = cleanName(p.name);
    p.gender = p.gender === "girl" ? "girl" : "boy";
    p.createdAt = p.createdAt || Date.now();
    p.updatedAt = p.updatedAt || p.createdAt;
    p.lastPlayed = p.lastPlayed || p.updatedAt;
    p.cleared = isObj(p.cleared) ? p.cleared : {};
    p.history = tidyHistory(Array.isArray(p.history) ? p.history : [], p.cleared);
    return p;
  }

  function normalise(data) {
    const out = blankState();
    if (!isObj(data)) return out;
    data = clone(data);
    out.account = Object.assign(out.account, isObj(data.account) ? data.account : {});
    out.deleted = isObj(data.deleted) ? data.deleted : {};
    const profs = isObj(data.profiles) ? data.profiles : {};
    Object.keys(profs).forEach(function (pid) {
      if (!out.deleted[pid]) out.profiles[pid] = normaliseProfile(profs[pid], pid);
    });
    out.activeProfileId = data.activeProfileId && out.profiles[data.activeProfileId] ? data.activeProfileId : null;
    return out;
  }

  // Combine the cloud copy with this device's copy. Nothing finished on either
  // side is lost; deletions and "clear history" are respected on both sides.
  function merge(cloudRaw, localRaw) {
    const a = normalise(cloudRaw), b = normalise(localRaw);
    const out = blankState();
    out.account = Object.assign({}, a.account);
    Object.keys(b.account).forEach(function (k) { if (b.account[k] != null) out.account[k] = b.account[k]; });
    out.deleted = maxMap(a.deleted, b.deleted);

    const ids = {};
    Object.keys(a.profiles).concat(Object.keys(b.profiles)).forEach(function (id) { ids[id] = true; });
    Object.keys(ids).forEach(function (id) {
      if (out.deleted[id]) return;
      const pa = a.profiles[id], pb = b.profiles[id];
      if (!pa || !pb) { out.profiles[id] = pa || pb; return; }
      const p = Object.assign({}, (pb.updatedAt || 0) >= (pa.updatedAt || 0) ? pb : pa);
      p.lastPlayed = Math.max(pa.lastPlayed || 0, pb.lastPlayed || 0);
      p.cleared = maxMap(pa.cleared, pb.cleared);
      p.history = tidyHistory(pb.history.concat(pa.history), p.cleared);
      out.profiles[id] = p;
    });

    const pick = b.activeProfileId || a.activeProfileId;   // this device's choice wins
    out.activeProfileId = pick && out.profiles[pick] ? pick : null;
    return out;
  }

  // What goes to the cloud: everything except this device's player choice.
  function forCloud(state) {
    const c = clone(state);
    delete c.activeProfileId;
    return c;
  }

  // JSON with sorted keys — used to tell whether two copies really differ.
  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (isObj(v)) return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    return JSON.stringify(v === undefined ? null : v);
  }

  const STORE = {
    state: blankState(),

    // Load this account's local cache (guest when nobody is signed in).
    init() {
      try {
        const raw = localStorage.getItem(LS_PREFIX + uidKey);
        STORE.state = raw ? normalise(JSON.parse(raw)) : blankState();
      } catch (e) { STORE.state = blankState(); }
      return STORE.state;
    },

    // Called by firebase.js when someone signs in or out.
    setUser(account) {
      uidKey = account && account.uid ? account.uid : "guest";
      STORE.init();
      if (account) Object.keys(account).forEach(function (k) {
        if (account[k] != null) STORE.state.account[k] = account[k];
      });
      STORE.emit();
    },

    /* ---------------- players ---------------- */
    profilesList() {
      return Object.keys(STORE.state.profiles || {})
        .map(function (k) { return STORE.state.profiles[k]; })
        .sort(function (a, b) { return (b.lastPlayed || 0) - (a.lastPlayed || 0); });
    },
    active() {
      const id = STORE.state.activeProfileId;
      return id && STORE.state.profiles[id] ? STORE.state.profiles[id] : null;
    },
    createProfile(name, gender) {
      const p = blankProfile(name, gender);
      STORE.state.profiles[p.id] = p;
      STORE.state.activeProfileId = p.id;
      STORE.save({ immediate: true });
      return p;
    },
    updateProfile(id, patch) {
      const p = STORE.state.profiles[id]; if (!p) return false;
      if (patch.name != null) p.name = cleanName(patch.name);
      if (patch.gender === "boy" || patch.gender === "girl") p.gender = patch.gender;
      p.updatedAt = Date.now();
      STORE.save({ immediate: true });
      return true;
    },
    selectProfile(id) {
      if (!STORE.state.profiles[id]) return false;
      STORE.state.activeProfileId = id;
      STORE.state.profiles[id].lastPlayed = Date.now();
      STORE.save();
      return true;
    },
    deleteProfile(id) {
      if (!STORE.state.profiles[id]) return false;
      STORE.state.deleted[id] = Date.now();
      delete STORE.state.profiles[id];
      if (STORE.state.activeProfileId === id) STORE.state.activeProfileId = null;
      STORE.save({ immediate: true });
      return true;
    },

    /* ---------------- assessment history ---------------- */
    // Finished sessions for the active player, newest first.
    // Narrow it with subjectId, then topicId, then levelId (all optional).
    history(subjectId, profile, topicId, levelId) {
      const p = profile || STORE.active();
      return ((p && p.history) || []).filter(function (h) {
        return (!subjectId || h.subjectId === subjectId) &&
               (!topicId || h.topicId === topicId) &&
               (!levelId || h.levelId === levelId);
      });
    },

    recordSession(entry) {
      const p = STORE.active(); if (!p || !entry) return null;
      const clean = {
        subjectId: entry.subjectId,
        topicId:   entry.topicId,
        levelId:   entry.levelId,
        ts:        entry.ts || Date.now(),
        total:     entry.total,
        correct:   entry.correct,
        pct:       entry.total ? Math.round(entry.correct / entry.total * 100) : 0,
        byCat:     entry.byCat || {},
        mistakes:  (entry.mistakes || []).slice(0, MISTAKES_MAX),
        answers:   entry.answers || null         // every question, for "View details"
      };
      p.history.unshift(clean);
      p.history = tidyHistory(p.history, p.cleared);
      p.lastPlayed = Date.now();
      STORE.save({ immediate: true });           // a finished session must never be lost
      return clean;
    },

    // subjectId = "english" | "bahasa" | "maths" | "all"
    clearHistory(subjectId) {
      const p = STORE.active(); if (!p) return;
      p.cleared[subjectId || "all"] = Date.now();
      p.history = tidyHistory(p.history, p.cleared);
      STORE.save({ immediate: true });
    },

    /* ---------------- persistence + sync ---------------- */
    persistLocal() {
      try { localStorage.setItem(LS_PREFIX + uidKey, JSON.stringify(STORE.state)); } catch (e) { }
    },

    // { immediate: true } for anything that must reach the cloud right away.
    save(opts) {
      STORE.persistLocal();
      STORE.emit();
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = null;
      if (!syncer) return;
      if (opts && opts.immediate) syncer();
      else saveTimer = setTimeout(function () { saveTimer = null; syncer(); }, 900);
    },

    // Take in a merged copy from the cloud. Merging again with the current
    // state keeps anything that happened on this device while the network
    // call was in flight. Returns true if what the player sees changed.
    adopt(merged) {
      const before = stable(forCloud(STORE.state));
      STORE.state = merge(merged, STORE.state);
      const changed = stable(forCloud(STORE.state)) !== before;
      STORE.persistLocal();
      if (changed) STORE.emit();
      return changed;
    },

    snapshot() { return clone(STORE.state); },
    setSyncer(fn) { syncer = fn; },
    onChange(fn) { listeners.push(fn); },
    emit() { listeners.forEach(function (fn) { try { fn(STORE.state); } catch (e) { } }); },

    // Exposed for firebase.js
    merge, normalise, forCloud, stable
  };

  window.STORE = STORE;
})();
