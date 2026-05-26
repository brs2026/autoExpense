"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import enMessages from "@/messages/en.json";
import bnMessages from "@/messages/bn.json";

type Language = "en" | "bn";

type ContextType = {
  language: Language;

  setLanguage: (
    language: Language
  ) => void;

  messages: typeof enMessages;
};

const LanguageContext =
  createContext<ContextType | null>(null);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] =
    useState<Language>("en");

  useEffect(() => {
    const storedLanguage =
      localStorage.getItem(
        "autoexpense-language"
      ) as Language | null;

    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  function handleSetLanguage(
    lang: Language
  ) {
    setLanguage(lang);

    localStorage.setItem(
      "autoexpense-language",
      lang
    );
  }

  const messages =
    language === "bn"
      ? bnMessages
      : enMessages;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        messages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}