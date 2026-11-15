import { describe, expect, test, vi } from 'vitest';

import {
  DEFAULT_VPN_PORT,
  detectPublicHost,
  hostFromHeader,
  resolveVpnPort,
} from '#server/utils/publicHost';

function reply(body: string, ok = true) {
  return Promise.resolve({ ok, text: () => Promise.resolve(body) });
}

const services = ['https://ip.one', 'https://ip.two', 'https://ip.three'];

describe('public host detection', () => {
  test('uses the first service that answers with an IPv4 address', async () => {
    const fetcher = vi.fn().mockImplementation(() => reply('198.51.100.4\n'));
    expect(await detectPublicHost({ services, fetcher })).toBe('198.51.100.4');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://ip.one');
  });

  test('falls back to the next service on errors, bad status or garbage', async () => {
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('timeout')))
      .mockImplementationOnce(() => reply('<html>blocked</html>'))
      .mockImplementationOnce(() => reply('203.0.113.9'));
    expect(await detectPublicHost({ services, fetcher })).toBe('203.0.113.9');
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  test('ignores non-ok responses and IPv6 answers', async () => {
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => reply('198.51.100.4', false))
      .mockImplementationOnce(() => reply('2001:db8::1'))
      .mockImplementationOnce(() => reply('198.51.100.5'));
    expect(await detectPublicHost({ services, fetcher })).toBe('198.51.100.5');
  });

  test('falls back to the request host when no service answers', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    expect(
      await detectPublicHost({
        services,
        fetcher,
        requestHost: '192.0.2.10:51821',
      })
    ).toBe('192.0.2.10');
  });

  test('returns null when nothing is known', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await detectPublicHost({ services, fetcher })).toBeNull();
  });

  test('an explicit override wins without network requests', async () => {
    const fetcher = vi.fn();
    expect(
      await detectPublicHost({
        override: ' vpn.example.org ',
        services,
        fetcher,
        requestHost: '192.0.2.10',
      })
    ).toBe('vpn.example.org');
    expect(fetcher).not.toHaveBeenCalled();
  });

  test.each([
    ['panel.example:51821', 'panel.example'],
    ['192.0.2.1', '192.0.2.1'],
    ['[2001:db8::1]:51821', '2001:db8::1'],
    ['', null],
    [null, null],
  ])('reads host %s as %s', (header, host) => {
    expect(hostFromHeader(header)).toBe(host);
  });

  test('uses the first valid port and defaults to the published one', () => {
    expect(resolveVpnPort(undefined, '')).toBe(DEFAULT_VPN_PORT);
    expect(DEFAULT_VPN_PORT).toBe(51820);
    expect(resolveVpnPort('abc', 70000, '51830')).toBe(51830);
    expect(resolveVpnPort(51900, '51830')).toBe(51900);
  });
});
