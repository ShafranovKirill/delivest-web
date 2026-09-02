import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export const customIconCollections = {
  vk: FileSystemIconLoader('./src/assets/icons/vk-logo', (svg) =>
    svg.replace(/^<svg /, '<svg fill="currentColor" '),
  ),
}

export const customCollectionsList = Object.keys(customIconCollections)
