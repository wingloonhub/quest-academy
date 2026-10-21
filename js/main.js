/* main.js — start Quest Academy */
(function () {
  "use strict";
  STORE.init();                                  // local cache (guest by default)
  AUTH.onAuth(function () { UI.route(); });      // sign-in / sign-out → right screen
  AUTH.onSync(UI.onSync);                        // cloud badge + redraw when another device changed data
  UI.route();                                    // first paint (splash until login state is known)

  // Unlock Web Audio on the very first tap (browser policy).
  document.addEventListener("click", function once() {
    if (window.SOUND) SOUND.unlock();
    document.removeEventListener("click", once, true);
  }, true);

  // PWA — register the service worker so phones offer "Install" / "Add to Home Screen".
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function (err) {
        console.warn("[PWA] service worker registration failed:", err);
      });
    });
  }

  // ===== Phone / browser back button — move around inside the app instead of leaving =====
  //   1. A popup is open → close it.
  //   2. The screen has a top-bar back button (id="bk") → press it.
  //   3. Otherwise we're at the top (menu / login) — press back twice within 2 s to leave.
  (function () {
    var lastRootBackTs = 0;
    function pushState() { try { history.pushState({ app: true }, "", location.href); } catch (e) { } }
    pushState();

    window.addEventListener("popstate", function () {
      var modal = document.querySelector(".overlay");
      if (modal) {
        pushState();
        var cancel = modal.querySelector("#cfNo, #pmNo");
        if (cancel) cancel.click(); else modal.remove();
        return;
      }
      var bk = document.getElementById("bk");
      if (bk) { pushState(); bk.click(); return; }
      var now = Date.now();
      if (now - lastRootBackTs < 2000) return;
      lastRootBackTs = now;
      pushState();
      if (window.UI && window.UI.toast) UI.toast("Press back again to exit", "");
    });
  })();
})();
