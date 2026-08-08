import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keep the URL's `?lang` in step with the form's declared locale, so a shared
 * link carries the language the form was authored in. No-op until the form has
 * loaded or when the param already matches.
 */
export function useSyncLangParam(formLocale: string | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!formLocale || searchParams.get('lang') === formLocale) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('lang', formLocale);
    setSearchParams(nextParams, { replace: true });
  }, [formLocale, searchParams, setSearchParams]);
}
