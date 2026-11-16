export const POPULAR_CATEGORY_ID = '00000000-0000-4000-8000-000000000001'

export function categoryDisplayName(
  category: { id?: string; name?: string },
  popularName: string,
): string | undefined {
  return category.id === POPULAR_CATEGORY_ID ? popularName : category.name
}
