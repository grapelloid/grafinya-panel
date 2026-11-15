# Changelog

## 1.0.0 — 2026-11-15

First public release of **Grafinya Panel**.

- Panel and Grafinya VPN node in a single Docker container.
- The first-run wizard only asks for the administrator account: the server address and
  port are detected automatically (port 51820/udp).
- Grafinya traffic obfuscation is enabled by default.
- "Graph paper notebook" design with light and dark themes, English interface.
- "by Grafinya" footer, our own documentation and a "Contributors & licenses" page.
- `/dev/net/tun` in docker-compose by default and a correct container health check.
