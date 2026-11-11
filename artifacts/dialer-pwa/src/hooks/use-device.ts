import { useEffect, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferredInstallPrompt: BIPEvent | null = null;
let installCompleted = false;
const installSubscribers = new Set<() => void>();
let installEventsRegistered = false;

function registerInstallEvents() {
  if (installEventsRegistered || typeof window === "undefined") return;
  installEventsRegistered = true;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event as BIPEvent;
    installSubscribers.forEach(notify => notify());
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installCompleted = true;
    installSubscribers.forEach(notify => notify());
  });
}

export function useInstall() {
  registerInstallEvents();
  const [evt, setEvt] = useState<BIPEvent | null>(() => deferredInstallPrompt);
  const [installed, setInstalled] = useState(() =>
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true));
  useEffect(() => {
    registerInstallEvents();
    const sync = () => {
      setEvt(deferredInstallPrompt);
      if (installCompleted || window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true) {
        setInstalled(true);
      }
    };
    installSubscribers.add(sync);
    sync();
    return () => { installSubscribers.delete(sync); };
  }, []);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && typeof document !== "undefined" && "ontouchend" in document);
  const prompt = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice.catch(() => null);
    setEvt(null);
  };
  return { canPrompt: !!evt, isIOS, installed, prompt };
}
