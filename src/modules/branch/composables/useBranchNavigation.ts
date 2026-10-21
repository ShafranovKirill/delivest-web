import { useRouter } from 'vue-router'
import { useBranchStore } from '../stores/branch.store'

export function useBranchNavigation() {
  const router = useRouter()
  const branchStore = useBranchStore()

  return (routeName: string) => {
    const slug = branchStore.activeBranch?.slug
    if (slug) router.push({ name: routeName, params: { slug } })
  }
}
