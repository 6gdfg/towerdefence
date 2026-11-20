type WebKitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitCancelFullScreen?: () => Promise<void> | void;
};

type WebKitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function getGameFullscreenElement(doc: Document = document) {
  return doc.fullscreenElement ?? (doc as WebKitDocument).webkitFullscreenElement ?? null;
}

export function isStandaloneWindow() {
  if (typeof window === 'undefined') return false;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
}

export function isAppleTouchDevice() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export async function enterGameFullscreen(element: HTMLElement, doc: Document = document): Promise<'native' | 'unsupported'> {
  const webkitDoc = doc as WebKitDocument;
  const request = typeof element.requestFullscreen === 'function' && doc.fullscreenEnabled !== false
    ? () => element.requestFullscreen()
    : typeof (element as WebKitElement).webkitRequestFullscreen === 'function' && webkitDoc.webkitFullscreenEnabled !== false
      ? () => (element as WebKitElement).webkitRequestFullscreen!()
      : null;
  if (!request) return 'unsupported';

  // Some WebKit versions return void. Wait for actual entry instead of assuming success.
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (success: boolean, error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      for (const event of ['fullscreenchange', 'webkitfullscreenchange']) doc.removeEventListener(event, check);
      for (const event of ['fullscreenerror', 'webkitfullscreenerror']) doc.removeEventListener(event, fail);
      if (success) resolve(); else reject(error ?? new Error('Browser rejected fullscreen'));
    };
    const check = () => { if (getGameFullscreenElement(doc) === element) finish(true); };
    const fail = () => finish(false, new Error('Browser rejected fullscreen'));
    const timer = setTimeout(() => finish(false, new Error('Browser did not enter fullscreen')), 1500);
    for (const event of ['fullscreenchange', 'webkitfullscreenchange']) doc.addEventListener(event, check);
    for (const event of ['fullscreenerror', 'webkitfullscreenerror']) doc.addEventListener(event, fail);
    try {
      Promise.resolve(request()).then(check, error => finish(false, error));
    } catch (error) {
      finish(false, error);
    }
  });
  return 'native';
}

export async function exitGameFullscreen(doc: Document = document) {
  if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function') {
    await doc.exitFullscreen();
  } else {
    const webkitDoc = doc as WebKitDocument;
    if (!webkitDoc.webkitFullscreenElement) return;
    const exit = webkitDoc.webkitExitFullscreen ?? webkitDoc.webkitCancelFullScreen;
    if (exit) await exit.call(doc);
  }
}
