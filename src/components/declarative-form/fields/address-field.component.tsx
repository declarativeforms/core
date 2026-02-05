import { useEffect, useState } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getPlacePredictions,
  getPlaceDetails,
  formatStructuredAddress,
  formatAddressString,
  type PlacePrediction,
} from "@/lib/google-places";
import type { IDeclarativeFormField } from "../types";

interface AddressFieldProps {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}

export function AddressField({ field, formField }: AddressFieldProps) {
  // Extract autocomplete type from field type
  const autocompleteType = (() => {
    switch (field.type) {
      case "address_locality":
        return "locality";
      case "address_region":
        return "region";
      case "address_country":
        return "country";
      case "address":
      default:
        return "address";
    }
  })();

  const outputFormat = field.outputFormat || "string";

  // State management
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  // Hooks
  const debouncedInput = useDebounce(inputValue, 300);

  // Check if Google Places API is loaded
  useEffect(() => {
    const checkApiLoaded = () => {
      if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
        setIsApiLoaded(true);
        return true;
      }
      return false;
    };

    if (checkApiLoaded()) {
      return;
    }

    // Poll for API to load (script is loaded with defer attribute)
    const interval = setInterval(() => {
      if (checkApiLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isApiLoaded) {
        console.warn("Google Places API failed to load within 10 seconds");
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Fetch suggestions effect
  useEffect(() => {
    if (!debouncedInput || !isApiLoaded) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const types = autocompleteType === "region" ? ["administrative_area_level_1"] : [autocompleteType];

    getPlacePredictions(debouncedInput, types)
      .then((predictions) => {
        setSuggestions(predictions);
      })
      .catch((err) => {
        console.error("Error fetching place predictions:", err);
        setSuggestions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [debouncedInput, isApiLoaded, autocompleteType]);

  // Selection handler
  const handleSelect = async (placeId: string) => {
    try {
      const place = await getPlaceDetails(placeId);
      const value =
        outputFormat === "structured"
          ? formatStructuredAddress(place)
          : formatAddressString(place);

      formField.onChange(value);
      setInputValue(place.formatted_address || "");
      setOpen(false);
    } catch (err) {
      console.error("Error fetching place details:", err);
    }
  };

  // Fallback for when API is not loaded
  if (!isApiLoaded) {
    return (
      <FormControl>
        <Input
          {...formField}
          className="bg-gray-50 border border-gray-200 focus:border-gray-300 h-auto leading-normal py-3 px-4 shadow-none text-base text-gray-900 w-full placeholder:text-gray-400"
          placeholder={field.placeholder || "Enter address"}
        />
      </FormControl>
    );
  }

  // Main render with autocomplete
  return (
    <FormControl>
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value.trim()) {
                  setOpen(true);
                }
              }}
              onBlur={formField.onBlur}
              className="bg-gray-50 border border-gray-200 focus:border-gray-300 h-auto leading-normal py-3 px-4 shadow-none text-base text-gray-900 w-full placeholder:text-gray-400"
              placeholder={field.placeholder || "Enter address"}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          align="start"
          side="bottom"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="w-full">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {suggestions.map((suggestion) => (
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
                      <span className="text-sm text-gray-500 break-words">
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
    </FormControl>
  );
}
