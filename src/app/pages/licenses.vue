<template>
  <main class="page-container max-w-3xl">
    <p class="eyebrow mb-3">Grafinya Panel</p>
    <h1 class="page-title">{{ $t('licenses.title') }}</h1>

    <section class="surface mt-8 p-6 text-sm leading-7 text-muted">
      <h2 class="mb-2 text-2xl text-foreground">{{ $t('licenses.author') }}</h2>
      <p>Grafinya Panel · by Grafinya · © 2026 {{ LEGAL_ENTITY }}</p>
      <p class="mt-3">
        {{ $t('licenses.license') }}
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          target="_blank"
          rel="noreferrer"
          class="underline"
        >
          GNU AGPL-3.0-only
        </a>
        . {{ $t('licenses.warranty') }}
      </p>
      <p class="mt-3">
        {{ $t('licenses.source') }}
        <a
          :href="links.sourceUrl"
          target="_blank"
          rel="noreferrer"
          class="underline"
        >
          {{ links.sourceUrl }}
        </a>
        <span v-if="globalStore.information?.currentRelease">
          ({{ globalStore.information.currentRelease }})
        </span>
      </p>
    </section>

    <section class="surface mt-6 p-6 text-sm leading-7 text-muted">
      <h2 class="mb-2 text-2xl text-foreground">
        {{ $t('licenses.contributors') }}
      </h2>
      <p class="mb-4">{{ $t('licenses.contributorsDescription') }}</p>
      <ul class="flex flex-col gap-3">
        <li v-for="item in components" :key="item.name">
          <a
            :href="item.url"
            target="_blank"
            rel="noreferrer"
            class="font-semibold text-foreground underline"
          >
            {{ item.name }}
          </a>
          — {{ item.copyright }} · {{ item.license }}
        </li>
      </ul>
      <p class="mt-4">
        “WireGuard” and the “WireGuard” logo are registered trademarks of Jason
        A. Donenfeld. {{ $t('licenses.notAffiliated') }}
      </p>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { LEGAL_ENTITY, useProjectLinks } from '~/utils/documentation';

const globalStore = useGlobalStore();
const links = useProjectLinks();

/** Upstream work included in this panel and its Docker image. */
const components = [
  {
    name: 'wg-easy',
    url: 'https://github.com/wg-easy/wg-easy',
    copyright: '© 2021–2026 Emile Nijssen & contributors',
    license: 'AGPL-3.0-only',
  },
  {
    name: 'amneziawg-go',
    url: 'https://github.com/amnezia-vpn/amneziawg-go',
    copyright: 'Copyright (C) 2017-2025 WireGuard LLC, Amnezia VPN',
    license: 'MIT',
  },
  {
    name: 'amneziawg-tools',
    url: 'https://github.com/amnezia-vpn/amneziawg-tools',
    copyright: 'Jason A. Donenfeld, Amnezia VPN',
    license: 'GPL-2.0',
  },
  {
    name: 'wireguard-go',
    url: 'https://git.zx2c4.com/wireguard-go',
    copyright: '© WireGuard LLC',
    license: 'MIT',
  },
  {
    name: 'wireguard-tools',
    url: 'https://git.zx2c4.com/wireguard-tools',
    copyright: '© Jason A. Donenfeld',
    license: 'GPL-2.0',
  },
  {
    name: 'iptables / nftables',
    url: 'https://netfilter.org',
    copyright: '© Netfilter Core Team',
    license: 'GPL-2.0',
  },
  {
    name: 'dumb-init',
    url: 'https://github.com/Yelp/dumb-init',
    copyright: '© Yelp, Inc.',
    license: 'MIT',
  },
  {
    name: 'Node.js',
    url: 'https://nodejs.org',
    copyright: '© OpenJS Foundation and contributors',
    license: 'MIT',
  },
  {
    name: 'Nuxt, Vue, Tailwind CSS',
    url: 'https://nuxt.com',
    copyright: '© their respective authors',
    license: 'MIT',
  },
  {
    name: 'Alpine Linux',
    url: 'https://alpinelinux.org',
    copyright: '© Alpine Linux contributors',
    license: 'various (see packages)',
  },
];
</script>
