import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/useDebounce';
import {
  formatAddressString,
  formatStructuredAddress,
  getPlaceDetails,
  getPlacePredictions,
  type PlacePrediction,
} from '@/lib/google-places';
import type { IRenderableAddressField } from '@declarativeforms/engine';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support';
import { useI18n } from '@/i18n';
import { useWaitForGlobal } from '../supporting/use-wait-for-global';

const AUTOCOMPLETE_TYPE = {
  address: 'address',
  address_locality: 'locality',
  address_region: 'region',
  address_country: 'country',
} as const;

type AddressSearch = {
  open: boolean;
  input: string;
  suggestions: PlacePrediction[];
  loading: boolean;
};

export function AddressField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps<IRenderableAddressField>) {
  const { t } = useI18n();
  const autocompleteType = AUTOCOMPLETE_TYPE[field.type];

  const checkGooglePlaces = useCallback(
    () => typeof window !== 'undefined' && !!window.google?.maps?.places,
    [],
  );
  const isApiLoaded = useWaitForGlobal(checkGooglePlaces, { timeout: 10_000 });

  const [search, setSearch] = useState<AddressSearch>({
    open: false,
    input: '',
    suggestions: [],
    loading: false,
  });

  const debouncedInput = useDebounce(search.input, 300);
  const visibleSuggestions =
    debouncedInput && isApiLoaded ? search.suggestions : [];

  useEffect(() => {
    if (!debouncedInput || !isApiLoaded) {
      return;
    }

    let isCancelled = false;
    const types =
      autocompleteType === 'region'
        ? ['administrative_area_level_1']
        : [autocompleteType];

    setSearch((s) => ({ ...s, loading: true }));
    getPlacePredictions(debouncedInput, types)
      .then((predictions) => {
        if (!isCancelled) setSearch((s) => ({ ...s, suggestions: predictions }));
      })
      .catch((err) => {
        console.error('Error fetching place predictions:', err);
        if (!isCancelled) setSearch((s) => ({ ...s, suggestions: [] }));
      })
      .finally(() => {
        if (!isCancelled) setSearch((s) => ({ ...s, loading: false }));
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedInput, isApiLoaded, autocompleteType]);

  const handleSelect = async (placeId: string) => {
    try {
      const place = await getPlaceDetails(placeId);
      controllerField.onChange(
        field.outputFormat === 'structured'
          ? formatStructuredAddress(place)
          : formatAddressString(place),
      );
      setSearch((s) => ({ ...s, input: place.formatted_address || '', open: false }));
    } catch (err) {
      console.error('Error fetching place details:', err);
    }
  };

  if (!isApiLoaded) {
    return (
      <Input
        {...controllerField}
        className="text-sm/4"
        placeholder={field.placeholder || t('address.placeholder')}
        required={field.required}
        aria-required={field.required}
      />
    );
  }

  const isOpen = search.open && visibleSuggestions.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={(open) => setSearch((s) => ({ ...s, open }))}>
      <PopoverTrigger asChild>
        <div className="relative w-full" aria-busy={search.loading}>
          <Input
            value={search.input}
            className="text-sm/4"
            onChange={(e) =>
              setSearch((s) => ({
                ...s,
                input: e.target.value,
                open: e.target.value.trim() ? true : s.open,
              }))
            }
            onBlur={controllerField.onBlur}
            placeholder={field.placeholder || t('address.placeholder')}
            required={field.required}
            aria-required={field.required}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={`address-suggestions-${field.id}`}
          />
          {search.loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <span className="sr-only" aria-live="polite">
            {search.loading ? t('address.loading_suggestions') : ''}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="w-full" id={`address-suggestions-${field.id}`}>
          <CommandEmpty>{t('address.no_results')}</CommandEmpty>
          <CommandGroup>
            {visibleSuggestions.map((suggestion) => (
              <CommandItem
                key={suggestion.place_id}
                onSelect={() => handleSelect(suggestion.place_id)}
                className="cursor-pointer items-start"
              >
                <div className="flex flex-col w-full">
                  <span className="font-medium break-words">
                    {suggestion.structured_formatting.main_text}
                  </span>
                  {suggestion.structured_formatting.secondary_text && (
                    <span className="text-sm text-muted-foreground break-words">
                      {suggestion.structured_formatting.secondary_text}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
