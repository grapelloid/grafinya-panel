import { fileURLToPath } from 'node:url';

import { defineNuxtConfig } from 'nuxt/config';
import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-06-19',
  future: {
    compatibilityVersion: 5,
  },
  experimental: {
    // @nuxtjs/i18n still imports Nitro's useRuntimeConfig from #imports.
    // Application server code keeps explicit imports via nitro.imports below.
    nitroAutoImports: true,
  },
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    'reka-ui/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
  ],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storage: 'cookie',
    storageKey: 'theme',
  },
  css: ['~/app.css'],
  vite: { plugins: [tailwindcss()] },
  i18n: {
    compilation: {
      // Protocol examples such as <b 0x...> are literal text, escaped by Vue.
      strictMessage: false,
    },
    // https://i18n.nuxtjs.org/docs/guide/server-side-translations
    experimental: {
      localeDetector: './localeDetector.ts',
    },
    // Grafinya Panel ships in English only.
    locales: [
      {
        code: 'en',
        file: 'en.json',
        language: 'en-US',
        name: 'English',
      },
    ],
    defaultLocale: 'en',
    vueI18n: './i18n.config.ts',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
  },
  nitro: {
    imports: {
      autoImport: false,
    },
    esbuild: {
      options: {
        target: 'node24',
      },
    },
    externals: {
      traceInclude: [
        fileURLToPath(
          new URL('./node_modules/.cache/wg-easy/trace.mjs', import.meta.url)
        ),
      ],
    },
  },
  alias: {
    '#db': fileURLToPath(new URL('./server/database/', import.meta.url)),
    '#cli': fileURLToPath(new URL('./cli', import.meta.url)),
  },
});
