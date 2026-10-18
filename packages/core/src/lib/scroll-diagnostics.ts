export function readFormScrollSnapshot(): string {
  const viewport = window.visualViewport;
  const elements = [
    document.documentElement,
    document.body,
    document.querySelector('[data-slot="card"]'),
    document.querySelector('[data-slot="card-title"]'),
    document.querySelector('form'),
    document.activeElement,
  ];

  return JSON.stringify({
    step: new URLSearchParams(window.location.search).get('step'),
    windowY: window.scrollY,
    documentY: document.scrollingElement?.scrollTop,
    innerHeight: window.innerHeight,
    viewport: viewport
      ? {
          pageTop: viewport.pageTop,
          offsetTop: viewport.offsetTop,
          height: viewport.height,
          scale: viewport.scale,
        }
      : null,
    elements: elements.map((element) => {
      if (!element) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return {
        tag: element.tagName,
        slot: element.getAttribute('data-slot'),
        top: rect.top,
        height: rect.height,
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        overflowY: style.overflowY,
        position: style.position,
      };
    }),
  });
}
