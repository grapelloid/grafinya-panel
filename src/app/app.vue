<template>
  <ToastProvider>
    <NuxtLayout>
      <NuxtPage />
      <ToastViewport
        class="fixed right-0 bottom-0 z-[2147483647] m-0 flex w-[390px] max-w-[100vw] list-none flex-col gap-[10px] p-[var(--viewport-padding)] outline-none [--viewport-padding:_25px]"
      >
        <BaseToast ref="toastRef" />
      </ToastViewport>
    </NuxtLayout>
  </ToastProvider>
</template>

<script setup lang="ts">
const toast = useToast();
const toastRef = useTemplateRef('toastRef');
toast.setToast(toastRef);

// make sure to fetch release early
useGlobalStore();

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: '',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Golos+Text:wght@400;500;600;700&display=swap',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
    },
  ],
  meta: [
    {
      name: 'mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
  ],
  title: 'Grafinya',
});
</script>
