import { create } from "zustand";
import { LANGUAGES, T, type LangCode } from "./translations";

const STORAGE_KEY = "jalrakshak-lang";

function readStored(): LangCode {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (v && LANGUAGES.some((l) => l.code === v)) return v;
  } catch {
    /* localStorage unavailable */
  }
  return "en";
}

interface LangState {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string) => string;
}

export const useLanguage = create<LangState>((set, get) => ({
  lang: readStored(),
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    set({ lang });
  },
  t: (key) => T[key]?.[get().lang] ?? T[key]?.en ?? key,
}));
