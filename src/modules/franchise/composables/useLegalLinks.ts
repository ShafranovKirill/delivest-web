import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { LegalKind } from '../api/franchise.service'

export const LEGAL_KINDS: LegalKind[] = ['offer', 'terms', 'privacy', 'consent']

export function useLegalLinks() {
  const route = useRoute()
  const { t } = useI18n()

  return computed(() =>
    LEGAL_KINDS.map((kind) => ({
      kind,
      label: t(`legal.titles.${kind}`),
      to: { name: 'legal', params: { slug: route.params.slug, kind } },
    })),
  )
}
