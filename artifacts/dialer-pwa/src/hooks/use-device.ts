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

export function useInstall() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true));
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const done = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", h); window.removeEventListener("appinstalled", done); };
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
