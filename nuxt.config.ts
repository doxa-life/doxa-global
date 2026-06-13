import { generateI18nLocales } from './config/languages'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/i18n'
  ],

  css: ['~/assets/css/main.css'],

  devServer: {
    port: 4000
  },

  runtimeConfig: {
    // Private (server-only)
    databaseUrl: process.env.DATABASE_URL || '',
    prayBaseUrl: process.env.NUXT_PRAY_BASE_URL || 'https://pray.doxa.life',
    formApiKey: process.env.FORM_API_KEY || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
      statinatorUrl: process.env.NUXT_PUBLIC_STATINATOR_URL || 'https://statinator.doxa.life',
      statinatorProjectId: process.env.NUXT_PUBLIC_STATINATOR_PROJECT_ID || 'doxa-global',
      statinatorEnabled: process.env.NUXT_PUBLIC_STATINATOR_ENABLED === 'true'
    }
  },

  i18n: {
    locales: generateI18nLocales(),
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'preferred_language',
      redirectOn: 'root'
    },
    vueI18n: './i18n.config.ts'
  },

  nitro: {
    preset: 'bun'
  }
})
