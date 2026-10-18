'use client';
import type { IDeclarativeFormTheme } from '@declarativeforms/engine';
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
  logo?: IDeclarativeFormTheme['logo'];
  className?: string;
}): React.JSX.Element | null {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const logoUrl = resolveLogoUrl(
    typeof props.logo === 'string' ? props.logo : props.logo?.image,
  );
  const configuredHeight =
    typeof props.logo === 'object' ? props.logo?.height : undefined;
  const logoHeight =
    typeof configuredHeight === 'number' &&
    Number.isInteger(configuredHeight) &&
    configuredHeight >= 32 &&
    configuredHeight <= 120
      ? configuredHeight
      : 56;

  if (!logoUrl || logoUrl === failedUrl) {
    return null;
  }

  return (
    <div
      className={mergeClassNames(
        'flex h-20 items-center justify-center px-6 pt-5',
        props.className,
      )}
      style={logoHeight > 56 ? { height: logoHeight + 24 } : undefined}
    >
      <div
        className="relative h-14 w-full max-w-56"
        style={logoHeight !== 56 ? { height: logoHeight } : undefined}
      >
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
