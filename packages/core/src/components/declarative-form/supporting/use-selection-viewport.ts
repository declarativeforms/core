'use client';
import { useSyncExternalStore, type CSSProperties } from 'react';

export type SelectionViewportStyle = Pick<
  CSSProperties,
  'maxHeight' | 'bottom'
>;

function subscribeViewport(onChange: () => void): () => void {
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', onChange);
  viewport?.addEventListener('scroll', onChange);
  window.addEventListener('resize', onChange);

  return () => {
    viewport?.removeEventListener('resize', onChange);
    viewport?.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

function getViewportSnapshot(): string {
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const bottom = Math.max(
    0,
    window.innerHeight - height - (viewport?.offsetTop ?? 0),
  );

  return `${height}:${bottom}`;
}

function getServerViewportSnapshot(): string {
  return '';
}

export function useSelectionViewport(): SelectionViewportStyle {
  const snapshot = useSyncExternalStore(
    subscribeViewport,
    getViewportSnapshot,
    getServerViewportSnapshot,
  );
  const [height, bottom] = snapshot.split(':').map(Number);

  return snapshot
    ? { maxHeight: height * 0.8, bottom }
    : { maxHeight: '80dvh' };
}
