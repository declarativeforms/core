'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import type {
  IRenderableAddressField,
  IStructuredAddress,
} from '@declarativeforms/engine';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { bindElement } from '@/components/declarative-form/supporting/bind-text-input';
import type { FieldProps } from '@/components/declarative-form/supporting/field.types';
import {
  formatAddressString,
  formatStructuredAddress,
  getPlaceDetails,
  getPlacePredictions,
  type PlacePrediction,
} from './google-places';
import { useDebounce } from './use-debounce';
import { useGooglePlacesReady } from './use-google-places-ready';

const AUTOCOMPLETE_TYPE = {
  address: 'address',
  address_locality: 'locality',
  address_region: 'region',
  address_country: 'country',
} as const;

const SEARCH_DEBOUNCE_MS = 300;

type AddressValue = string | IStructuredAddress;

type AddressSearch = {
  open: boolean;
  input: string;
  suggestions: Array<PlacePrediction>;
  loading: boolean;
};

function toAddressDisplay(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object' && 'formatted_address' in value) {
    const formatted = (value as { formatted_address?: unknown })
      .formatted_address;

    return typeof formatted === 'string' ? formatted : '';
  }

  return '';
}

export function AddressField(
  props: FieldProps<IRenderableAddressField, AddressValue>,
) {
  const i18n = useI18n();
  const autocompleteType = AUTOCOMPLETE_TYPE[props.field.type];
  const isApiLoaded = useGooglePlacesReady();

  const [search, setSearch] = useState<AddressSearch>(() => ({
    open: false,
    input: toAddressDisplay(props.control.value),
    suggestions: [],
    loading: false,
  }));

  const debouncedInput = useDebounce(search.input, SEARCH_DEBOUNCE_MS);
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
        if (!isCancelled) {
          setSearch((s) => ({ ...s, suggestions: predictions }));
        }
      })
      .catch((err) => {
        console.error('Error fetching place predictions:', err);
        if (!isCancelled) {
          setSearch((s) => ({ ...s, suggestions: [] }));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setSearch((s) => ({ ...s, loading: false }));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedInput, isApiLoaded, autocompleteType]);

  const handleSelect = async (placeId: string): Promise<void> => {
    try {
      const place = await getPlaceDetails(placeId);
      props.control.onChange(
        props.field.outputFormat === 'structured'
          ? formatStructuredAddress(place)
          : formatAddressString(place),
      );
      setSearch((s) => ({
        ...s,
        input: place.formatted_address || '',
        open: false,
      }));
    } catch (err) {
      console.error('Error fetching place details:', err);
    }
  };

  if (!isApiLoaded) {
    return (
      <Input
        {...bindElement(props.control)}
        value={toAddressDisplay(props.control.value)}
        onChange={(event) => props.control.onChange(event.target.value)}
        className="text-sm/4"
        placeholder={props.field.placeholder || i18n.t('address.placeholder')}
        required={props.field.required}
        aria-required={props.field.required}
      />
    );
  }

  const isOpen = search.open && visibleSuggestions.length > 0;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => setSearch((s) => ({ ...s, open }))}
    >
      <PopoverTrigger asChild>
        <div className="relative w-full" aria-busy={search.loading}>
          <Input
            {...bindElement(props.control)}
            value={search.input}
            className="text-sm/4"
            onChange={(e) =>
              setSearch((s) => ({
                ...s,
                input: e.target.value,
                open: e.target.value.trim() ? true : s.open,
              }))
            }
            placeholder={
              props.field.placeholder || i18n.t('address.placeholder')
            }
            required={props.field.required}
            aria-required={props.field.required}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={`address-suggestions-${props.field.id}`}
          />
          {search.loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <span className="sr-only" aria-live="polite">
            {search.loading ? i18n.t('address.loading_suggestions') : ''}
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
        <Command
          className="w-full"
          id={`address-suggestions-${props.field.id}`}
        >
          <CommandEmpty>{i18n.t('address.no_results')}</CommandEmpty>
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
