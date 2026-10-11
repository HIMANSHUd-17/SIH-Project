import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  LanguageCode, TranslationKey, UserRole,
  translate, getStoredLanguage, setStoredLanguage,
  SUPPORTED_LANGUAGES, LanguageMeta
} from './i18n';

// ─────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────
interface LanguageContextValue {
  /** Translate a key for a given role */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Current language code for each role */
  languages: Record<UserRole, LanguageCode>;
  /** Change the language for a specific role */
  setLanguage: (role: UserRole, code: LanguageCode) => void;
  /** All supported languages for rendering selectors */
  supportedLanguages: LanguageMeta[];
  /** Get language metadata for a code */
  getLangMeta: (code: LanguageCode) => LanguageMeta;
  /** Convenience: translate with a fixed role */
  tFor: (role: UserRole) => (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Provider — wrap <App> with this once in main.tsx
// ─────────────────────────────────────────────────────────────
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languages, setLanguages] = useState<Record<UserRole, LanguageCode>>({
    tourist: getStoredLanguage('tourist'),
    guide: getStoredLanguage('guide'),
    admin: getStoredLanguage('admin'),
  });

  const setLanguage = useCallback((role: UserRole, code: LanguageCode) => {
    setStoredLanguage(role, code);
    setLanguages(prev => ({ ...prev, [role]: code }));
  }, []);

  // Default t() uses tourist as fallback — components should use tFor(role)
  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(languages.tourist, key, vars),
    [languages.tourist]
  );

  const tFor = useCallback(
    (role: UserRole) =>
      (key: TranslationKey, vars?: Record<string, string | number>) =>
        translate(languages[role], key, vars),
    [languages]
  );

  const getLangMeta = useCallback(
    (code: LanguageCode) =>
      SUPPORTED_LANGUAGES.find(l => l.code === code) ?? SUPPORTED_LANGUAGES[0],
    []
  );

  const value = useMemo(
    () => ({ t, languages, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES, getLangMeta, tFor }),
    [t, languages, setLanguage, getLangMeta, tFor]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// ─────────────────────────────────────────────────────────────
// Hook — usage: const { t } = useLanguage('tourist');
// ─────────────────────────────────────────────────────────────
export function useLanguage(role: UserRole) {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  const t = ctx.tFor(role);
  return {
    t,
    lang: ctx.languages[role],
    setLanguage: (code: LanguageCode) => ctx.setLanguage(role, code),
    supportedLanguages: ctx.supportedLanguages,
    getLangMeta: ctx.getLangMeta,
  };
}

// ─────────────────────────────────────────────────────────────
// Reusable LanguageSelector component
// ─────────────────────────────────────────────────────────────
interface LanguageSelectorProps {
  role: UserRole;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  showLabel?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  role,
  className = '',
  selectClassName = '',
  showLabel = true,
}) => {
  const { lang, setLanguage, supportedLanguages } = useLanguage(role);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {showLabel && (
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
          Interface Language
        </span>
      )}
      <select
        value={lang}
        onChange={e => setLanguage(e.target.value as LanguageCode)}
        className={`rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${selectClassName}`}
        aria-label="Select interface language"
      >
        {supportedLanguages.map(l => (
          <option key={l.code} value={l.code}>
            {l.label} — {l.labelEn}
          </option>
        ))}
      </select>
    </div>
  );
};
