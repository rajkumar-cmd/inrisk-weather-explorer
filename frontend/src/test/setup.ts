import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

class ResizeObserverStub {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    )
  }
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub

HTMLElement.prototype.getBoundingClientRect = () => ({
  width: 800,
  height: 320,
  top: 0,
  right: 800,
  bottom: 320,
  left: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
})

afterEach(() => cleanup())
