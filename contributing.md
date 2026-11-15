# Участие в разработке

Спасибо, что хотите помочь Grafinya Panel!

- **Ошибки и идеи** — создайте issue: что делали, что ожидали, что получилось,
  версия панели (внизу страницы) и логи `docker logs grafinya`.
- **Pull request** — небольшие и сфокусированные изменения. Перед отправкой:

  ```shell
  cd src
  pnpm install
  pnpm lint && pnpm typecheck && pnpm test:unit
  ```

- Новые строки интерфейса добавляйте в `src/i18n/locales/ru.json` и `en.json`.
- Отправляя код, вы соглашаетесь распространять его на условиях
  [AGPL-3.0-only](LICENSE).
