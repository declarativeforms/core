'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import type {
  IRenderableAddressField,
  IStructuredAddress,
} from '@declarativeforms/engine';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { stripHtml } from '@/lib/strip-html';
import {
  MobileSelectionSheet,
  bindElement,
  useMobileLayout,
  type FieldProps,
} from '@/components/declarative-form/supporting';
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
  selecting: boolean;
  error: 'suggestions' | 'details' | null;
};

function toAddressDisplay(address: unknown): string {
  if (typeof address === 'string') {
    return address;
  }

  if (
    address &&
    typeof address === 'object' &&
    'formatted_address' in address
  ) {
    const formatted = (address as { formatted_address?: unknown })
      .formatted_address;

    return typeof formatted === 'string' ? formatted : '';
  }

  return '';
}

function AddressAutocomplete(
  props: FieldProps<IRenderableAddressField, AddressValue> & {
    mobile: boolean;
  },
): React.JSX.Element {
  const i18n = useI18n();
  const autocompleteType = AUTOCOMPLETE_TYPE[props.field.type];
  const selectionRequest = useRef(0);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState<AddressSearch>(() => ({
    open: false,
    input: toAddressDisplay(props.control.value),
    suggestions: [],
    loading: false,
    selecting: false,
    error: null,
  }));
  const debouncedInput = useDebounce(search.input, SEARCH_DEBOUNCE_MS);
  const visibleSuggestions =
    search.input === debouncedInput ? search.suggestions : [];

  useEffect(
    () => () => {
      selectionRequest.current++;
    },
    [],
  );

  useEffect(() => {
    if (
      !search.open ||
      !debouncedInput.trim() ||
      debouncedInput !== search.input
    ) {
      return;
    }

    let isCancelled = false;
    const types =
      autocompleteType === 'region'
        ? ['administrative_area_level_1']
        : [autocompleteType];

    getPlacePredictions(debouncedInput, types)
      .then((predictions) => {
        if (!isCancelled) {
          setSearch((current) => ({
            ...current,
            suggestions: predictions,
            loading: false,
          }));
        }
      })
      .catch((error) => {
        console.error('Error fetching place predictions:', error);
        if (!isCancelled) {
          setSearch((current) => ({
            ...current,
            suggestions: [],
            loading: false,
            error: 'suggestions',
          }));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedInput, search.input, search.open, autocompleteType, retry]);

  function handleOpenChange(open: boolean): void {
    selectionRequest.current++;
    setSearch((current) => ({
      ...current,
      open,
      input: props.mobile
        ? toAddressDisplay(props.control.value)
        : current.input,
      suggestions: [],
      loading:
        open &&
        !!(
          props.mobile ? toAddressDisplay(props.control.value) : current.input
        ).trim(),
      selecting: false,
      error: null,
    }));
    if (!open) {
      props.control.onBlur();
    }
  }

  function changeSearch(input: string): void {
    selectionRequest.current++;
    setSearch((current) => ({
      ...current,
      input,
      open: true,
      suggestions: [],
      loading: !!input.trim(),
      selecting: false,
      error: null,
    }));
  }

  async function selectPlace(placeId: string): Promise<void> {
    const request = ++selectionRequest.current;
    setSearch((current) => ({ ...current, selecting: true, error: null }));

    try {
      const place = await getPlaceDetails(placeId);
      if (request !== selectionRequest.current) {
        return;
      }

      props.control.onChange(
        props.field.outputFormat === 'structured'
          ? formatStructuredAddress(place)
          : formatAddressString(place),
      );
      props.control.onBlur();
      setSearch((current) => ({
        ...current,
        input: place.formatted_address || '',
        open: false,
        selecting: false,
        loading: false,
        suggestions: [],
      }));
    } catch (error) {
      console.error('Error fetching place details:', error);
      if (request === selectionRequest.current) {
        setSearch((current) => ({
          ...current,
          selecting: false,
          error: 'details',
        }));
      }
    }
  }

  const suggestions = (
    <CommandList
      className={
        props.mobile
          ? 'min-h-0 max-h-none flex-1 overflow-y-auto overscroll-contain p-2'
          : undefined
      }
    >
      {(search.loading || search.selecting) && (
        <div
          role="status"
          className="flex items-center gap-2 p-3 text-sm text-muted-foreground"
        >
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          {i18n.t(
            search.selecting
              ? 'address.loading_details'
              : 'address.loading_suggestions',
          )}
        </div>
      )}
      {search.error && (
        <div role="alert" className="p-3 text-sm text-destructive">
          {i18n.t(
            search.error === 'details'
              ? 'address.details_failed'
              : 'address.search_failed',
          )}
          {search.error === 'suggestions' && (
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => {
                setSearch((current) => ({
                  ...current,
                  loading: true,
                  error: null,
                }));
                setRetry((current) => current + 1);
              }}
            >
              {i18n.t('address.retry')}
            </Button>
          )}
        </div>
      )}
      {!search.loading && !search.selecting && !search.error && (
        <CommandEmpty>
          {i18n.t(
            search.input.trim() ? 'address.no_results' : 'address.placeholder',
          )}
        </CommandEmpty>
      )}
      <CommandGroup>
        {visibleSuggestions.map((suggestion) => (
          <CommandItem
            key={suggestion.place_id}
            value={suggestion.place_id}
            disabled={search.selecting}
            onSelect={() => selectPlace(suggestion.place_id)}
            className="min-h-11 cursor-pointer items-start"
          >
            <div className="flex min-w-0 w-full flex-col whitespace-normal wrap-anywhere">
              <span>{suggestion.structured_formatting.main_text}</span>
              {suggestion.structured_formatting.secondary_text && (
                <span className="text-sm text-muted-foreground">
                  {suggestion.structured_formatting.secondary_text}
                </span>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  );

  if (props.mobile) {
    return (
      <MobileSelectionSheet
        open={search.open}
        onOpenChange={handleOpenChange}
        title={props.field.label}
        trigger={
          <Button
            {...bindElement(props.control)}
            type="button"
            role="combobox"
            variant="outline"
            aria-required={props.field.required}
            data-placeholder={
              toAddressDisplay(props.control.value) ? undefined : true
            }
            className="form-combobox w-full justify-between font-normal"
          >
            <span className="min-w-0 truncate text-left">
              {toAddressDisplay(props.control.value) ||
                props.field.placeholder ||
                i18n.t('address.placeholder')}
            </span>
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        }
      >
        <Command
          shouldFilter={false}
          className="min-h-0 h-auto rounded-none"
          aria-busy={search.loading || search.selecting}
        >
          <CommandInput
            data-selection-autofocus
            aria-label={stripHtml(props.field.label)}
            placeholder={
              props.field.placeholder || i18n.t('address.placeholder')
            }
            value={search.input}
            onValueChange={changeSearch}
            className="text-base"
          />
          {suggestions}
        </Command>
      </MobileSelectionSheet>
    );
  }

  return (
    <Popover
      open={search.open && !!search.input.trim()}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <div
          className="relative w-full"
          aria-busy={search.loading || search.selecting}
        >
          <Input
            {...bindElement(props.control)}
            value={search.input}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder={
              props.field.placeholder || i18n.t('address.placeholder')
            }
            required={props.field.required}
            aria-required={props.field.required}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={search.open && !!search.input.trim()}
            aria-controls={`address-suggestions-${props.field.id}`}
          />
          {search.loading && (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
        side="bottom"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command
          shouldFilter={false}
          id={`address-suggestions-${props.field.id}`}
        >
          {suggestions}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function AddressField(
  props: FieldProps<IRenderableAddressField, AddressValue>,
): React.JSX.Element {
  const i18n = useI18n();
  const isMobile = useMobileLayout();
  const isApiLoaded = useGooglePlacesReady();

  if (!isApiLoaded) {
    return (
      <Input
        {...bindElement(props.control)}
        value={toAddressDisplay(props.control.value)}
        onChange={(event) => props.control.onChange(event.target.value)}
        placeholder={props.field.placeholder || i18n.t('address.placeholder')}
        required={props.field.required}
        aria-required={props.field.required}
      />
    );
  }

  return (
    <AddressAutocomplete
      key={isMobile ? 'mobile' : 'desktop'}
      {...props}
      mobile={isMobile}
    />
  );
}
