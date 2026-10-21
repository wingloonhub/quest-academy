/* firebase.js — email/password login + Firestore cloud database.

   Database layout: one document per account at  users/{uid}  holding every
   player on that account and all of their finished sessions. Each sync runs
   as a Firestore TRANSACTION: read the cloud copy, merge it with this
   device's copy (store.js → merge), write the result back. Two devices can
   never wipe each other's results, and whichever phone or computer signs in
   gets the same players, history and Parent Report.

   Sync happens: right after sign-in, after every finished session or player
   change, whenever the app comes back to the foreground, and when the
   internet comes back.

   If firebase-config.js still has PASTE_... placeholders, the app runs in
   LOCAL-ONLY mode (saves on this device, no login). */
(function () {
  "use strict";
  const cfg = window.FIREBASE_CONFIG || {};
  const looksSet = (v) => typeof v === "string" && v.length > 0 && v.indexOf("PASTE") === -1;
  const configured = looksSet(cfg.apiKey) && looksSet(cfg.projectId) && looksSet(cfg.appId);

  const AUTH = {
    enabled: false,          // true once Firebase has started
    configured,
    ready: false,            // true once we know whether someone is signed in
    user: null,
    session: false,          // true once signed in (and first sync tried) OR playing as local guest
    pendingName: "",         // name typed on the sign-up form, used for the first player
    sync: { status: configured ? "idle" : "local", at: 0, msg: "" },
    _authCbs: [],
    _syncCbs: [],
    onAuth(fn) { AUTH._authCbs.push(fn); },
    onSync(fn) { AUTH._syncCbs.push(fn); },
    _emitAuth() { AUTH._authCbs.forEach(fn => { try { fn(AUTH.user); } catch (e) { console.error(e); } }); }
  };

  // status: local | idle | syncing | saved | offline | error
  function setSync(status, msg, changed) {
    AUTH.sync = { status, at: Date.now(), msg: msg || "" };
    AUTH._syncCbs.forEach(fn => { try { fn(AUTH.sync, !!changed); } catch (e) { console.error(e); } });
  }

  function localOnly(reason) {
    AUTH.enabled = false;
    AUTH.ready = true;
    AUTH.sync = { status: "local", at: 0, msg: "" };
    AUTH.signUp = AUTH.signIn = AUTH.resetPassword = function () { return Promise.reject(new Error(reason)); };
    AUTH.signOut = function () { AUTH.session = false; AUTH._emitAuth(); return Promise.resolve(); };
    AUTH.startGuest = function () {
      STORE.setUser({ uid: null, email: null });
      AUTH.user = null; AUTH.session = true; AUTH._emitAuth();
    };
    AUTH.syncNow = function () { return Promise.resolve(false); };
    AUTH.verifyPassword = function () { return Promise.resolve(); };   // no account password on this device
    window.AUTH = AUTH;
  }

  if (!configured) { localOnly("Cloud login is not set up yet — see README.md, Step 2."); return; }

  let db = null, fbAuth = null;
  try {
    firebase.initializeApp(cfg);
    fbAuth = firebase.auth();
    db = firebase.firestore();
    try { fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) { }
    AUTH.enabled = true;
  } catch (e) {
    console.error("Firebase init failed:", e);
    localOnly("Firebase failed to start — check js/firebase-config.js and your internet connection.");
    return;
  }

  const docRef = (uid) => db.collection("users").doc(uid);

  /* ---------- sync: read cloud → merge → write, as one transaction ---------- */
  let inflight = null;
  let again = false;

  function syncNow() {
    if (!AUTH.user) return Promise.resolve(false);
    if (inflight) { again = true; return inflight; }
    const uid = AUTH.user.uid;
    setSync("syncing");
    inflight = db.runTransaction(function (tx) {
      return tx.get(docRef(uid)).then(function (snap) {
        const cloud = snap.exists ? snap.data() : null;
        const merged = STORE.merge(cloud, STORE.snapshot());
        const out = STORE.forCloud(merged);
        out.updatedAt = Date.now();
        const cloudCmp = cloud ? STORE.stable(STORE.forCloud(STORE.normalise(cloud))) : "";
        const outCmp = STORE.stable(STORE.forCloud(STORE.normalise(out)));
        if (cloudCmp !== outCmp) tx.set(docRef(uid), out);
        return merged;
      });
    }).then(function (merged) {
      if (!AUTH.user || AUTH.user.uid !== uid) return false;
      const changed = STORE.adopt(merged);
      setSync("saved", "", changed);
      return changed;
    }).catch(function (err) {
      console.warn("[sync] failed:", err);
      const text = String((err && (err.code || err.message)) || "");
      const offline = navigator.onLine === false || /unavailable|offline|network|deadline/i.test(text);
      setSync(offline ? "offline" : "error", (err && err.message) || text);
      return false;
    }).then(function (result) {
      inflight = null;
      if (again) { again = false; setTimeout(syncNow, 0); }
      return result;
    });
    return inflight;
  }
  AUTH.syncNow = syncNow;
  STORE.setSyncer(syncNow);

  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      const t = setTimeout(resolve, ms);
      promise.then(function () { clearTimeout(t); resolve(); }, function () { clearTimeout(t); resolve(); });
    });
  }

  /* ---------- auth ---------- */
  AUTH.signUp = function (email, password, displayName) {
    AUTH.pendingName = (displayName || "").trim();
    return fbAuth.createUserWithEmailAndPassword(email, password).then(function (cred) {
      if (AUTH.pendingName) return cred.user.updateProfile({ displayName: AUTH.pendingName }).then(() => cred, () => cred);
      return cred;
    });
  };
  AUTH.signIn = (email, password) => fbAuth.signInWithEmailAndPassword(email, password);
  // Re-check the account password (used before creating / resetting the admin PIN).
  AUTH.verifyPassword = function (password) {
    const u = fbAuth.currentUser;
    if (!u || !u.email) return Promise.reject(new Error("Please sign in first."));
    return u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, password));
  };
  AUTH.resetPassword = (email) => fbAuth.sendPasswordResetEmail(email);
  AUTH.signOut = () => fbAuth.signOut();

  fbAuth.onAuthStateChanged(function (user) {
    if (user) {
      const account = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || AUTH.pendingName || (user.email ? user.email.split("@")[0] : null)
      };
      STORE.setUser(account);                 // this account's local cache first
      AUTH.user = user;
      // Pull + merge the cloud copy before showing the menu (max 8 s, then
      // carry on with the local copy — the sync finishes in the background).
      withTimeout(syncNow(), 8000).then(function () {
        if (AUTH.user !== user) return;
        AUTH.session = true;
        AUTH.ready = true;
        AUTH._emitAuth();
      });
    } else {
      AUTH.user = null;
      AUTH.session = false;
      AUTH.ready = true;
      STORE.setUser(null);
      setSync("idle");
      AUTH._emitAuth();
    }
  });

  // Coming back to the app (switching from another app/tab) or getting the
  // internet back → pull whatever the other devices did.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && AUTH.user) syncNow();
  });
  window.addEventListener("online", function () { if (AUTH.user) syncNow(); });
  // A failed sync retries every minute until it gets through.
  setInterval(function () {
    if (AUTH.user && (AUTH.sync.status === "offline" || AUTH.sync.status === "error")) syncNow();
  }, 60000);

  window.AUTH = AUTH;
})();
