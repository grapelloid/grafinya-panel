import fs from 'node:fs/promises';

import { describe, expect, test, vi, onTestFinished } from 'vitest';

import { databaseFixture } from '../helpers/database';
import { resetCryptoMocks } from '../helpers/crypto';

import * as setup from '#server/features/setup';
import { getIpInformation } from '#server/utils/ip';
import { roles } from '#shared/utils/permissions';
import { wg } from '#server/utils/wgHelper';
import { firewall } from '#server/utils/firewall';
import { detectPublicHost } from '#server/utils/publicHost';
const env = vi.hoisted(() => ({
  WG_ENV: {} as Record<string, string>,
  WG_INITIAL_ENV: {},
}));
vi.mock('#server/utils/config', () => env);
vi.mock('#server/utils/publicHost', async (original) => ({
  ...(await original<typeof import('#server/utils/publicHost')>()),
  detectPublicHost: vi.fn(),
}));
vi.mock('#server/utils/ip', async (original) => ({
  ...(await original<typeof import('#server/utils/ip')>()),
  getIpInformation: vi.fn(),
}));

async function fixture() {
  const database = await databaseFixture();
  resetCryptoMocks();
  const writeConfiguration = vi.spyOn(fs, 'writeFile').mockResolvedValue();
  vi.spyOn(wg, 'dump').mockResolvedValue([]);
  const sync = vi.spyOn(wg, 'sync').mockResolvedValue('');
  const restart = vi.spyOn(wg, 'restart').mockResolvedValue('');
  vi.spyOn(firewall, 'rebuildRules').mockResolvedValue();
  onTestFinished(() => vi.restoreAllMocks());
  const ipInformation = vi
    .mocked(getIpInformation)
    .mockReset()
    .mockResolvedValue([{ label: 'Public', value: '192.0.2.1' }]);
  const detect = vi
    .mocked(detectPublicHost)
    .mockReset()
    .mockResolvedValue('203.0.113.7');
  return {
    ...database,
    ipInformation,
    detect,
    writeConfiguration,
    sync,
    restart,
  };
}

describe('setup', () => {
  test('creates the administrator and fills host and port automatically', async () => {
    const { store, writeConfiguration, sync, detect } = await fixture();
    await setup.createAdministrator(
      'admin',
      'a-long-password',
      'panel.test:51821'
    );
    expect(detect).toHaveBeenCalledWith(
      expect.objectContaining({ requestHost: 'panel.test:51821' })
    );
    expect(await setup.status()).toEqual({ step: 0, done: true });
    expect(await store.users.get(1)).toMatchObject({
      role: roles.ADMIN,
      password: 'hash:a-long-password',
    });
    expect(await store.userConfigs.get()).toMatchObject({
      host: '203.0.113.7',
      port: 51820,
    });
    expect((await store.interfaces.get()).port).toBe(51820);
    expect(writeConfiguration.mock.lastCall?.[1]).toContain(
      'ListenPort = 51820'
    );
    expect(sync).toHaveBeenCalledExactlyOnceWith('wg0');
    await expect(
      setup.createAdministrator('another', 'a-long-password')
    ).rejects.toMatchObject({ status: 400 });
    expect(await store.users.count()).toBe(1);
  });

  test('keeps the default port aligned even if the interface port was changed', async () => {
    const { store } = await fixture();
    await store.interfaces.update({ port: 51822 });
    await store.userConfigs.update({ port: 51822 });
    await setup.createAdministrator('admin', 'a-long-password');
    expect((await store.interfaces.get()).port).toBe(51820);
    expect((await store.userConfigs.get()).port).toBe(51820);
  });

  test('rolls back account creation when the setup transition cannot be saved', async () => {
    const { connection, store } = await fixture();
    const before = await store.userConfigs.get();
    await connection.execute(
      "CREATE TRIGGER fail_step BEFORE UPDATE OF setup_step ON general_table BEGIN SELECT RAISE(ABORT, 'step failure'); END"
    );
    await expect(
      setup.createAdministrator('admin', 'a-long-password')
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        message: expect.stringContaining('step failure'),
      }),
    });
    expect(await store.users.count()).toBe(0);
    expect(await store.userConfigs.get()).toEqual(before);
    expect(await setup.status()).toEqual({ step: 1, done: false });
  });

  test('finishes an installation left in the old host and port step', async () => {
    const { store } = await fixture();
    await store.general.update({ setupStep: 3 });
    expect(await setup.status()).toEqual({ step: 0, done: true });
    expect(await store.userConfigs.get()).toMatchObject({
      host: '203.0.113.7',
      port: 51820,
    });
  });

  test('persists initial defaults without changing explicit gateways and skips completed setup', async () => {
    const { store } = await fixture();
    const config = {
      username: 'admin',
      password: 'a-long-password',
      host: 'vpn.example.com',
      port: 51900,
      ipv4Cidr: '10.9.0.15/24',
      ipv6Cidr: 'fd00::f/64',
      dns: ['1.1.1.1'],
    };
    await setup.initialize(config);
    expect(await setup.status()).toEqual({ step: 0, done: true });
    expect(await store.interfaces.get()).toMatchObject({
      ipv4Cidr: config.ipv4Cidr,
      ipv6Cidr: config.ipv6Cidr,
      port: 51900,
    });
    expect(await store.userConfigs.get()).toMatchObject({
      host: config.host,
      defaultDns: config.dns,
    });
    await setup.initialize({
      ...config,
      username: 'replacement',
      port: 51901,
    });
    expect(await store.users.count()).toBe(1);
    expect((await store.interfaces.get()).port).toBe(51900);
  });

  test('detects the host for unattended setup when none is given', async () => {
    const { store } = await fixture();
    await setup.initialize({ username: 'admin', password: 'a-long-password' });
    expect(await setup.status()).toEqual({ step: 0, done: true });
    expect(await store.userConfigs.get()).toMatchObject({
      host: '203.0.113.7',
      port: 51820,
    });
  });

  test('restores initial defaults if account creation fails', async () => {
    const { store } = await fixture();
    await store.users.insert({
      username: 'duplicate',
      name: 'Existing',
      role: roles.ADMIN,
      enabled: true,
      totpVerified: false,
    });
    const network = await store.interfaces.get();
    const defaults = await store.userConfigs.get();
    await expect(
      setup.initialize({
        username: 'duplicate',
        password: 'a-long-password',
        host: 'vpn.example.com',
        port: 51900,
        ipv4Cidr: '10.9.0.0/24',
        ipv6Cidr: 'fd00::/64',
        dns: ['1.1.1.1'],
      })
    ).rejects.toThrow('User already exists');
    expect(await store.interfaces.get()).toEqual(network);
    expect(await store.userConfigs.get()).toEqual(defaults);
    expect(await setup.status()).toEqual({ step: 1, done: false });
  });

  test('forces both ports to VPN_PORT on start when it is set', async () => {
    const { store } = await fixture();
    await store.interfaces.update({ port: 51822 });
    await store.userConfigs.update({ port: 51822 });
    expect(await setup.enforceVpnPort()).toBe(false);
    env.WG_ENV.VPN_PORT = '51820';
    onTestFinished(() => {
      delete env.WG_ENV.VPN_PORT;
    });
    expect(await setup.enforceVpnPort()).toBe(true);
    expect((await store.interfaces.get()).port).toBe(51820);
    expect((await store.userConfigs.get()).port).toBe(51820);
    expect(await setup.enforceVpnPort()).toBe(false);
  });
});
