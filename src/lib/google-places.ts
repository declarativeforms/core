/**
 * Google Places API utility functions
 * Provides autocomplete predictions and place details
 */

/// <reference types="google.maps" />

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Get place predictions from Google Places Autocomplete API
 * Uses the newer AutocompleteSuggestion API (recommended as of March 2025)
 */
export async function getPlacePredictions(
  input: string,
  types: string[]
): Promise<PlacePrediction[]> {
  if (!input.trim()) {
    return [];
  }

  try {
    const request: any = {
      input,
    };

    // The new API uses different type values than the old API
    // For general address autocomplete, we don't restrict by type
    // Only add includedPrimaryTypes for specific valid types
    if (types.length > 0) {
      const validTypes = types.filter(type =>
        type !== 'address' &&
        type !== 'geocode' &&
        type !== '(regions)' &&
        type !== '(cities)'
      );

      if (validTypes.length > 0) {
        request.includedPrimaryTypes = validTypes;
      }
    }

    const { suggestions } = await (window.google!.maps.places as any).AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

    if (!suggestions || suggestions.length === 0) {
      return [];
    }

    // Debug: log the structure to understand the response format
    console.log('AutocompleteSuggestion response:', suggestions[0]);

    return suggestions.map((suggestion: any) => {
      const placePrediction = suggestion.placePrediction;
      console.log('placePrediction:', placePrediction);

      return {
        place_id: placePrediction.placeId,
        description: placePrediction.text?.toString() || '',
        structured_formatting: {
          main_text: placePrediction.structuredFormat?.mainText?.toString() || placePrediction.text?.toString() || '',
          secondary_text: placePrediction.structuredFormat?.secondaryText?.toString() || "",
        },
      };
    });
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    return [];
  }
}

/**
 * Get detailed place information by place ID
 * Uses the newer Place API (recommended as of March 2025)
 */
export async function getPlaceDetails(
  placeId: string
): Promise<any> {
  try {
    const { Place } = (window.google!.maps.places as any);

    const place = new Place({
      id: placeId,
    });

    await place.fetchFields({
      fields: ['addressComponents', 'formattedAddress', 'id'],
    });

    // Map the new API format to the old format for compatibility
    return {
      address_components: place.addressComponents,
      formatted_address: place.formattedAddress,
      place_id: place.id,
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
}

/**
 * Format place result into structured address object
 */
export function formatStructuredAddress(
  place: google.maps.places.PlaceResult
): IStructuredAddress {
  const components: Record<string, string> = {};

  if (place.address_components) {
    place.address_components.forEach(
      (component: google.maps.GeocoderAddressComponent) => {
        const type = component.types[0];
        components[type] = component.long_name;
      }
    );
  }

  return {
    formatted_address: place.formatted_address || "",
    street_number: components.street_number,
    route: components.route,
    locality: components.locality,
    administrative_area_level_1: components.administrative_area_level_1,
    country: components.country,
    postal_code: components.postal_code,
    place_id: place.place_id || "",
  };
}

/**
 * Format place result into a simple address string
 */
export function formatAddressString(
  place: google.maps.places.PlaceResult
): string {
  return place.formatted_address || "";
}

/**
 * Structured address interface matching the type definition
 */
export interface IStructuredAddress {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
  place_id: string;
}
