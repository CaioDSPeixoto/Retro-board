"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type PrivacyContextType = {
  privacyEnabled: boolean;
  togglePrivacy: () => void;
};

const PrivacyContext = createContext<PrivacyContextType>({
  privacyEnabled: false,
  togglePrivacy: () => {},
});

export function usePrivacy() {
  return useContext(PrivacyContext);
}

const STORAGE_KEY = "finance-privacy-mode";

export default function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacyEnabled, setPrivacyEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setPrivacyEnabled(true);
  }, []);

  const togglePrivacy = useCallback(() => {
    setPrivacyEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <PrivacyContext.Provider value={{ privacyEnabled, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}
