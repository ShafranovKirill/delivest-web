/// <reference types="vite/client" />

declare global {
  interface Window {
    ymaps: {
      ready(callback: () => void): void
      Map: new (
        element: HTMLElement | string,
        options: Record<string, unknown>,
      ) => {
        destroy(): void
        geoObjects: {
          add(object: unknown): void
        }
      }
      Placemark: new (
        geometry: number[],
        properties?: Record<string, unknown>,
        options?: Record<string, unknown>,
      ) => unknown
    }
  }
}

export {}
