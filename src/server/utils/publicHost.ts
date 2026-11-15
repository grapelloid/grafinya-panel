import { isIP } from 'node:net';

import { createDebug } from 'obug';

const HOST_DEBUG = createDebug('Server');

/** UDP port published in docker-compose.yml (`51820:51820/udp`). */
export const DEFAULT_VPN_PORT = 51820;

/** Plain-text "what is my IP" services, asked in order. */
export const PUBLIC_IP_SERVICES = [
  'https://api.ipify.org',
  'https://ifconfig.me/ip',
  'https://icanhazip.com',
  'https://ipv4.icanhazip.com',
];

type Fetcher = (
  url: string,
  init: { signal: AbortSignal; headers: Record<string, string> }
) => Promise<{ ok: boolean; text(): Promise<string> }>;

export type DetectPublicHostOptions = {
  /** Explicit override (PUBLIC_HOST / INIT_HOST). Wins when set. */
  override?: string | null;
  /** `Host` header of the request that completes setup, used as last resort. */
  requestHost?: string | null;
  services?: string[];
  timeoutMs?: number;
  fetcher?: Fetcher;
};

/** Strips the port (and IPv6 brackets) from a `Host` header value. */
export function hostFromHeader(header: string | null | undefined) {
  if (!header) {
    return null;
  }
  const value = header.trim();
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    return end > 1 ? value.slice(1, end) : null;
  }
  const [host] = value.split(':');
  return host || null;
}

async function askService(
  url: string,
  fetcher: Fetcher,
  timeoutMs: number
): Promise<string | null> {
  try {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'grafinya-panel' },
    });
    if (!response.ok) {
      return null;
    }
    const ip = (await response.text()).trim();
    return isIP(ip) === 4 ? ip : null;
  } catch (error) {
    HOST_DEBUG(`Public IP lookup via ${url} failed:`, error);
    return null;
  }
}

/**
 * Finds the address clients should connect to, without asking the user:
 * explicit override → public IPv4 from external services → request host.
 */
export async function detectPublicHost({
  override,
  requestHost,
  services = PUBLIC_IP_SERVICES,
  timeoutMs = 4000,
  fetcher = fetch,
}: DetectPublicHostOptions = {}): Promise<string | null> {
  const explicit = override?.trim();
  if (explicit) {
    return explicit;
  }
  for (const url of services) {
    const ip = await askService(url, fetcher, timeoutMs);
    if (ip) {
      return ip;
    }
  }
  return hostFromHeader(requestHost);
}

/** Port clients connect to and the interface listens on. */
export function resolveVpnPort(...candidates: (string | number | undefined)[]) {
  for (const candidate of candidates) {
    const port =
      typeof candidate === 'number'
        ? candidate
        : Number.parseInt(candidate ?? '', 10);
    if (Number.isInteger(port) && port > 0 && port < 65536) {
      return port;
    }
  }
  return DEFAULT_VPN_PORT;
}
