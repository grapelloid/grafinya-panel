# Contributing

Thanks for helping Grafinya Panel!

- **Bugs and ideas**: open an issue describing what you did, what you expected and what
  happened, plus the panel version (shown at the bottom of the page) and the output of
  `docker logs grafinya`.
- **Pull requests**: keep them small and focused. Before submitting, run:

  ```shell
  cd src
  pnpm install
  pnpm lint && pnpm typecheck && pnpm test:unit
  ```

- The panel is English-only: add new interface strings to `src/i18n/locales/en.json`.
- By submitting code you agree to distribute it under the
  [AGPL-3.0-only](LICENSE) license.
