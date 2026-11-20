import assert from 'node:assert/strict';
import test from 'node:test';
import { enterGameFullscreen, exitGameFullscreen, getGameFullscreenElement, isStandaloneWindow } from '../src/td/gameFullscreen';

function fakeDocument() {
  return Object.assign(new EventTarget(), {
    fullscreenEnabled: true,
    fullscreenElement: null as HTMLElement | null,
    webkitFullscreenEnabled: true,
    webkitFullscreenElement: null as HTMLElement | null,
  });
}

test('standard fullscreen waits for real entry and exits through the standard API', async () => {
  const doc = fakeDocument();
  const element = {
    requestFullscreen: async () => {
      doc.fullscreenElement = element as unknown as HTMLElement;
      doc.dispatchEvent(new Event('fullscreenchange'));
    },
  } as unknown as HTMLElement;
  const documentWithExit = Object.assign(doc, { exitFullscreen: async () => { doc.fullscreenElement = null; } });
  assert.equal(await enterGameFullscreen(element, doc as unknown as Document), 'native');
  assert.equal(getGameFullscreenElement(doc as unknown as Document), element);
  await exitGameFullscreen(documentWithExit as unknown as Document);
  assert.equal(getGameFullscreenElement(doc as unknown as Document), null);
});

test('WebKit void-returning fullscreen waits for its event and uses its matching exit API', async () => {
  const doc = fakeDocument();
  doc.fullscreenEnabled = false;
  let standardRequested = false;
  const element = {
    requestFullscreen: () => { standardRequested = true; },
    webkitRequestFullscreen: () => {
      setTimeout(() => {
        doc.webkitFullscreenElement = element as unknown as HTMLElement;
        doc.dispatchEvent(new Event('webkitfullscreenchange'));
      }, 0);
    },
  } as unknown as HTMLElement;
  const documentWithExit = Object.assign(doc, { webkitExitFullscreen: () => { doc.webkitFullscreenElement = null; } });
  assert.equal(await enterGameFullscreen(element, doc as unknown as Document), 'native');
  assert.equal(standardRequested, false);
  assert.equal(getGameFullscreenElement(doc as unknown as Document), element);
  await exitGameFullscreen(documentWithExit as unknown as Document);
  assert.equal(getGameFullscreenElement(doc as unknown as Document), null);
});

test('unsupported and disabled fullscreen returns an explicit result instead of pretending to enter', async () => {
  const doc = fakeDocument();
  assert.equal(await enterGameFullscreen({} as HTMLElement, doc as unknown as Document), 'unsupported');
  doc.fullscreenEnabled = false;
  doc.webkitFullscreenEnabled = false;
  const element = { requestFullscreen: () => { throw new Error('Must not call'); }, webkitRequestFullscreen: () => { throw new Error('Must not call'); } } as unknown as HTMLElement;
  assert.equal(await enterGameFullscreen(element, doc as unknown as Document), 'unsupported');
  assert.equal(getGameFullscreenElement(doc as unknown as Document), null);
});

test('rejected, throwing and silent-no-op requests never count as fullscreen', async () => {
  const doc = fakeDocument() as unknown as Document;
  await assert.rejects(enterGameFullscreen({ requestFullscreen: async () => { throw new Error('Denied'); } } as HTMLElement, doc), /Denied/);
  await assert.rejects(enterGameFullscreen({ requestFullscreen: () => Promise.reject() } as HTMLElement, doc), /rejected fullscreen/);
  await assert.rejects(enterGameFullscreen({ requestFullscreen: () => { throw new Error('Denied'); } } as unknown as HTMLElement, doc), /Denied/);
  await assert.rejects(enterGameFullscreen({ requestFullscreen: async () => {} } as HTMLElement, doc), /did not enter/);
  assert.equal(getGameFullscreenElement(doc), null);
});

test('native fullscreen is not mistaken for an installed standalone window', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { standalone: false } });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { matchMedia: (query: string) => ({ matches: query === '(display-mode: fullscreen)' }) } });
    assert.equal(isStandaloneWindow(), false);
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { standalone: true } });
    assert.equal(isStandaloneWindow(), true);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator); else Reflect.deleteProperty(globalThis, 'navigator');
  }
});
