import { createError } from 'nuxt/server';

import { changeCidr } from '#server/features/vpn/interface';
import { commit } from '#server/features/vpn/lifecycle';
import { getDatabase } from '#db';
import type { Repositories } from '#db/store';
import type { SetupStepType } from '#shared/contracts/general';
import { createPasswordUser } from '#server/features/identity/accounts';
import { WG_ENV, WG_INITIAL_ENV } from '#server/utils/config';
import { detectPublicHost, resolveVpnPort } from '#server/utils/publicHost';

/**
 * Grafinya setup is a single step: create the administrator.
 * Host and port are filled in automatically, the user is never asked.
 */
export type SetupAction = 2;

/** Step written by older versions after the administrator was created. */
const LEGACY_ENDPOINT_STEP = 3;

function checkStep(state: SetupStepType, action: SetupAction) {
  if (state.done) {
    throw createError({ status: 400, statusText: 'Invalid state' });
  }
  if (state.step !== 1) {
    throw createError({ status: 500, statusText: 'Invalid setup step' });
  }
  if (action !== 2) {
    throw createError({ status: 400, statusText: 'Invalid step' });
  }
  return state;
}

/** Port clients connect to; always the one published by docker-compose. */
export function vpnPort() {
  return resolveVpnPort(WG_ENV?.VPN_PORT, WG_INITIAL_ENV?.PORT);
}

/** Public address clients connect to. */
export function publicHost(requestHost?: string | null) {
  return detectPublicHost({
    override: WG_ENV?.PUBLIC_HOST || WG_INITIAL_ENV?.HOST,
    requestHost,
  });
}

async function saveEndpoint(tx: Repositories, host: string | null) {
  const port = vpnPort();
  if (host) {
    await tx.userConfigs.update({ host, port });
  } else {
    await tx.userConfigs.update({ port });
  }
  await tx.interfaces.update({ port });
}

export async function status() {
  const state = await getDatabase().general.getSetupStep();
  if (state.step !== LEGACY_ENDPOINT_STEP) {
    return state;
  }
  // An installation stopped in the old "host and port" step: finish it.
  const host = await publicHost();
  await commit(async (tx) => {
    if ((await tx.general.getSetupStep()).step !== LEGACY_ENDPOINT_STEP) {
      return;
    }
    await saveEndpoint(tx, host);
    await tx.general.update({ setupStep: 0 });
  });
  return getDatabase().general.getSetupStep();
}

export async function assertStep(action: SetupAction) {
  return checkStep(await getDatabase().general.getSetupStep(), action);
}

export async function createAdministrator(
  username: string,
  password: string,
  requestHost?: string | null
) {
  // Fail fast before asking external services for the public address.
  checkStep(await getDatabase().general.getSetupStep(), 2);
  const host = await publicHost(requestHost);
  await commit(async (tx) => {
    checkStep(await tx.general.getSetupStep(), 2);
    await createPasswordUser(tx.users, username, password);
    await saveEndpoint(tx, host);
    await tx.general.update({ setupStep: 0 });
  });
}

/**
 * When VPN_PORT is set explicitly, the client endpoint port and the interface
 * listen port are forced to it on every start, so they always match the port
 * published in docker-compose.yml.
 */
export async function enforceVpnPort() {
  const raw = WG_ENV?.VPN_PORT;
  if (!raw) {
    return false;
  }
  const port = resolveVpnPort(raw);
  const database = getDatabase();
  const [defaults, network] = await Promise.all([
    database.userConfigs.get(),
    database.interfaces.get(),
  ]);
  if (defaults.port === port && network.port === port) {
    return false;
  }
  await database.transaction(async (tx) => {
    await tx.userConfigs.update({ port });
    await tx.interfaces.update({ port });
  });
  return true;
}

export type InitialSetup = {
  username?: string;
  password?: string;
  host?: string;
  port?: number;
  ipv4Cidr?: string;
  ipv6Cidr?: string;
  dns?: string[];
  allowedIps?: string[];
};

/** Initial data and setup completion commit together, or neither does. */
export async function initialize(config: InitialSetup) {
  if ((await getDatabase().general.getSetupStep()).done) {
    return;
  }
  const host =
    config.username && config.password
      ? (config.host ?? (await publicHost()))
      : null;
  return getDatabase().transaction(async (tx) => {
    if ((await tx.general.getSetupStep()).done) {
      return;
    }
    if (config.ipv4Cidr && config.ipv6Cidr) {
      await changeCidr(tx, {
        ipv4Cidr: config.ipv4Cidr,
        ipv6Cidr: config.ipv6Cidr,
      });
    }
    if (config.dns) {
      await tx.userConfigs.update({ defaultDns: config.dns });
    }
    if (config.allowedIps) {
      await tx.userConfigs.update({ defaultAllowedIps: config.allowedIps });
    }
    if (config.username && config.password && host) {
      const port = resolveVpnPort(config.port, WG_ENV?.VPN_PORT);
      await createPasswordUser(tx.users, config.username, config.password);
      await tx.userConfigs.update({ host, port });
      await tx.interfaces.update({ port });
      await tx.general.update({ setupStep: 0 });
    }
  });
}
