import {
  DEFAULT_DOCS_URL,
  DEFAULT_SOURCE_URL,
  LEGAL_ENTITY,
} from '#shared/utils/links';

export { LEGAL_ENTITY };

/** Documentation and source links come from the server (DOCS_URL / SOURCE_URL). */
export function useProjectLinks() {
  const globalStore = useGlobalStore();
  return computed(() => ({
    docsUrl: globalStore.information?.docsUrl ?? DEFAULT_DOCS_URL,
    sourceUrl: globalStore.information?.sourceUrl ?? DEFAULT_SOURCE_URL,
  }));
}
