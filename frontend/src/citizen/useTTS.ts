import { useCallback, useState } from "react";

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(
    (text: string, speechLang: string): boolean => {
      if (!supported) return false;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = speechLang;
        utter.rate = 0.95;
        utter.onstart = () => setSpeaking(true);
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
        return true;
      } catch {
        setSpeaking(false);
        return false;
      }
    },
    [supported]
  );

  return { supported, speaking, speak };
}
