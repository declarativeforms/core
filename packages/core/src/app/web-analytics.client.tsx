'use client';
import { useEffect } from 'react';
import { initializeWebAnalytics } from '@/lib/web-analytics';

export function WebAnalytics() {
  useEffect(() => {
    initializeWebAnalytics();
  }, []);

  return null;
}
