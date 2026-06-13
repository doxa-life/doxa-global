// Language registry for doxa-global. Built i18n-ready: every language the
// platform may eventually serve is listed here, but only those with
// `enabled: true` are wired into the running app. v1 ships English only;
// turning on another locale later is additive (flip `enabled`, add its
// common.json) and does not require code changes.

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  dir?: 'rtl'
  enabled: boolean
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', enabled: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', enabled: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', enabled: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', enabled: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', enabled: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', enabled: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', enabled: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', enabled: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', enabled: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl', enabled: false }
]

export const ENABLED_LANGUAGES = LANGUAGES.filter(l => l.enabled)
export const LANGUAGE_CODES = LANGUAGES.map(l => l.code)
export const ENABLED_LANGUAGE_CODES = ENABLED_LANGUAGES.map(l => l.code)

export function generateI18nLocales() {
  return ENABLED_LANGUAGES.map(lang => ({
    code: lang.code,
    name: lang.nativeName,
    ...(lang.dir && { dir: lang.dir }),
    files: [`${lang.code}/common.json`]
  }))
}
