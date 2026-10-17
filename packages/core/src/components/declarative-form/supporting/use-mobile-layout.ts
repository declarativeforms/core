'use client';
import { useSyncExternalStore } from 'react';

function subscribeMobileLayout(onChange: () => void): () => void {
  const query = window.matchMedia('(width < 768px)');
  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
}

function isMobileLayout(): boolean {
  return window.matchMedia('(width < 768px)').matches;
}

function getServerMobileLayout(): boolean {
  return false;
}

export function useMobileLayout(): boolean {
  return useSyncExternalStore(
    subscribeMobileLayout,
    isMobileLayout,
    getServerMobileLayout,
  );
}
