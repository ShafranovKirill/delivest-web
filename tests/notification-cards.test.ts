import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createRenderer, nextTick, ref } from 'vue'

function item(id: string) { return { id, title: id, body: id, cta: null, expires_at: null } }
const data = ref({ pages: [{ data: [item('one'), item('two'), item('three')] }] })
const enabled = ref(true)
const identity = ref('user')
const epoch = ref(1)
const branchId = ref('branch')
const dismiss = vi.fn()
const click = vi.fn()
let dismissedId = ''
const invalidateQueries = vi.fn(async () => {
  data.value = { pages: [{ data: data.value.pages[0]!.data.filter((notice) => notice.id !== dismissedId) }] }
  await nextTick()
})

vi.mock('@/api/client', () => ({ queryClient: { invalidateQueries } }))
vi.mock('@/modules/cart/stores/cart.store', () => ({ useCartStore: () => ({ applyPromoCode: vi.fn() }) }))
vi.mock('@/modules/branch/composables/useBranchNavigation', () => ({ useBranchNavigation: () => vi.fn() }))
vi.mock('../src/modules/notifications/api/notifications.service', () => ({ NotificationsService: { dismiss, click } }))
vi.mock('../src/modules/notifications/composables/useNotifications', () => ({
  NOTICES_KEY: 'customer-notifications',
  useNotices: () => ({
    data, enabled, identity, epoch, branchId, deviceId: ref('device'),
    hasNextPage: ref(false), isFetchingNextPage: ref(false), fetchNextPage: vi.fn(),
  }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const { default: NotificationCards } = await import('../src/modules/notifications/components/NotificationCards.vue')
// Vitest compiles Vue templates for SSR. Its setup state still runs in a custom renderer.
NotificationCards.render = () => null

type Node = { parent: Node | null; children: Node[]; text: string }
const createNode = (text = ''): Node => ({ parent: null, children: [], text })
const renderer = createRenderer<Node, Node>({
  createElement: () => createNode(), createText: createNode, createComment: createNode,
  setText: (node, text) => { node.text = text },
  setElementText: (node, text) => { node.text = text },
  patchProp: () => undefined,
  insert: (node, parent) => { parent.children.push(node); node.parent = parent },
  remove: (node) => { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1) },
  parentNode: (node) => node.parent,
  nextSibling: () => null,
})
type State = {
  activeNotice?: { id: string }
  activeId: string | null
  lastPosition: number
  position: number
  hasMany: boolean
  announcement: string
  show: (direction: number) => void
  dismiss: (id: string) => Promise<void>
  onTouchStart: (event: TouchEvent) => void
  onTouchEnd: (event: TouchEvent) => void
}
let app: ReturnType<typeof renderer.createApp>
let state: State
beforeEach(() => {
  dismiss.mockReset().mockImplementation(async (_branch: string, _device: string, id: string) => { dismissedId = id })
  click.mockReset()
  invalidateQueries.mockClear()
  data.value = { pages: [{ data: [item('one'), item('two'), item('three')] }] }
  identity.value = 'user'
  epoch.value = 1
  branchId.value = 'branch'
  enabled.value = true
  app = renderer.createApp(NotificationCards)
  app.provide(Symbol.for('v-scx'), { modules: new Set() })
  app.mount(createNode())
  state = (app as unknown as { _instance: { setupState: State } })._instance.setupState
})
afterEach(() => app.unmount())

it('changes cards without click or dismiss, wrapping in both directions', async () => {
  expect(state.activeNotice?.id).toBe('one')
  state.show(1)
  expect(state.activeNotice?.id).toBe('two')
  state.show(-1)
  expect(state.activeNotice?.id).toBe('one')
  state.show(-1)
  expect(state.activeNotice?.id).toBe('three')
  data.value = { pages: [{ data: [item('zero'), item('one'), item('two'), item('three')] }] }
  await nextTick()
  expect(state.activeNotice?.id).toBe('three')
  expect(click).not.toHaveBeenCalled()
  expect(dismiss).not.toHaveBeenCalled()
})

it('selects the neighbor after close and clears the last card', async () => {
  state.show(1)
  await state.dismiss('two')
  expect(dismiss).toHaveBeenCalledWith('branch', 'device', 'two')
  expect(state.activeNotice?.id).toBe('three')
  await state.dismiss('three')
  expect(state.activeNotice?.id).toBe('one')
  expect(state.hasMany).toBe(false)
  state.show(1)
  expect(state.activeNotice?.id).toBe('one')
  await state.dismiss('one')
  expect(state.activeNotice).toBeUndefined()
  expect(state.activeId).toBeNull()
  expect(click).not.toHaveBeenCalled()
})

it('resets position and interrupted swipe on scope changes', async () => {
  state.show(1)
  state.onTouchStart({ changedTouches: [{ clientX: 100, clientY: 0 }] } as unknown as TouchEvent)
  epoch.value++
  await nextTick()
  expect(state.position).toBe(0)
  expect(state.lastPosition).toBe(0)
  expect(state.announcement).toBe('')
  state.onTouchEnd({ changedTouches: [{ clientX: 0, clientY: 0 }] } as unknown as TouchEvent)
  expect(state.position).toBe(0)
  state.show(1)
  identity.value = 'other-user'
  await nextTick()
  expect(state.position).toBe(0)
  state.show(1)
  branchId.value = 'other-branch'
  await nextTick()
  expect(state.position).toBe(0)
  state.show(1)
  enabled.value = false
  await nextTick()
  expect(state.position).toBe(0)
  expect(click).not.toHaveBeenCalled()
})

it('has no selected card for an empty list and no navigation for one card', async () => {
  data.value = { pages: [{ data: [] }] }
  await nextTick()
  expect(state.activeNotice).toBeUndefined()
  expect(state.hasMany).toBe(false)
  state.show(1)
  expect(state.activeId).toBeNull()
  data.value = { pages: [{ data: [item('only')] }] }
  await nextTick()
  expect(state.activeNotice?.id).toBe('only')
  expect(state.hasMany).toBe(false)
  state.show(-1)
  expect(state.activeNotice?.id).toBe('only')
  expect(click).not.toHaveBeenCalled()
  expect(dismiss).not.toHaveBeenCalled()
})
