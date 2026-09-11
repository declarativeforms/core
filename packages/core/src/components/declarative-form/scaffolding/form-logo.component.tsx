'use client';
import Image, { type ImageLoaderProps } from 'next/image';
import { useState } from 'react';
import { mergeClassNames } from '@/lib/utils';

function loadLogo(props: ImageLoaderProps): string {
  return props.src;
}

function resolveLogoUrl(logoUrl: string | undefined): string | null {
  if (!logoUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(logoUrl);

    return parsedUrl.protocol === 'https:' ? logoUrl : null;
  } catch {
    return null;
  }
}

export function FormLogo(props: {
  url?: string;
  className?: string;
}): React.JSX.Element | null {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const logoUrl = resolveLogoUrl(props.url);

  if (!logoUrl || logoUrl === failedUrl) {
    return null;
  }

  return (
    <div
      className={mergeClassNames(
        'flex h-20 items-center justify-center px-6 pt-5',
        props.className,
      )}
    >
      <div className="relative h-14 w-full max-w-56">
        <Image
          alt=""
          className="object-contain"
          fill
          loader={loadLogo}
          onError={() => setFailedUrl(logoUrl)}
          sizes="224px"
          src={logoUrl}
          unoptimized
        />
      </div>
    </div>
  );
}
