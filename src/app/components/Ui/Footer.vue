<template>
  <footer
    class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-6 text-[11px] leading-relaxed text-subtle sm:px-7"
  >
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="brand-wordmark text-base text-muted">Grafinya Panel</span>
      <span
        v-if="globalStore.information?.currentRelease"
        class="rounded border border-line px-1.5 py-0.5 font-mono text-[10px]"
      >
        {{ globalStore.information.currentRelease }}
      </span>
      <span>· by Grafinya · © 2026 {{ LEGAL_ENTITY }}</span>
    </div>
    <div class="flex flex-wrap gap-5">
      <a
        :href="links.docsUrl"
        target="_blank"
        rel="noreferrer"
        class="hover:text-foreground"
      >
        {{ $t('common.documentation') }} ↗
      </a>
      <NuxtLink to="/licenses" class="hover:text-foreground">
        {{ $t('licenses.title') }}
      </NuxtLink>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { LEGAL_ENTITY, useProjectLinks } from '~/utils/documentation';

const globalStore = useGlobalStore();
const links = useProjectLinks();
</script>
