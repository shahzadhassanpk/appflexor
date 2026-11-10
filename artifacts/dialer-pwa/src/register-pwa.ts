// Do not cache Vite's dev/HMR shell. Offline shell support is production-only.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL;
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // The web app still works online if installation is disallowed by a browser.
      window.dispatchEvent(new Event("dialer-install-unavailable"));
    });
  });
}
