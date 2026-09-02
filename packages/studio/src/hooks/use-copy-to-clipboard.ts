import { useEffect, useState } from 'react';

export type ClipboardCopy = {
  copy: (value: string) => void;
  isCopied: boolean;
  hasFailed: boolean;
};

export function useCopyToClipboard(): ClipboardCopy {
  const [isCopied, setIsCopied] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isCopied]);

  return {
    copy: (value: string) => {
      setHasFailed(false);

      if (!navigator.clipboard) {
        setHasFailed(true);

        return;
      }

      navigator.clipboard
        .writeText(value)
        .then(() => {
          setIsCopied(true);
        })
        .catch(() => {
          setHasFailed(true);
        });
    },
    hasFailed,
    isCopied,
  };
}
