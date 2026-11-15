import { defineI18nLocaleDetector } from '#imports';

// Grafinya Panel is English-only: server-side messages always use the default locale.
export default defineI18nLocaleDetector((_event, config) => config.defaultLocale);
