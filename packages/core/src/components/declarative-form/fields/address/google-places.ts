/// <reference types="google.maps" />

'use client';
import type { IStructuredAddress } from '@declarativeforms/engine';

export type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

type TextValue = {
  toString(): string;
};

type AutocompleteSuggestionRequest = {
  input: string;
  includedPrimaryTypes?: Array<string>;
};

type GooglePlacePrediction = {
  placeId: string;
  text?: TextValue;
  structuredFormat?: {
    mainText?: TextValue;
    secondaryText?: TextValue;
  };
};

type GoogleAutocompleteSuggestion = {
  placePrediction: GooglePlacePrediction;
};

type GooglePlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(
      request: AutocompleteSuggestionRequest,
    ): Promise<{ suggestions?: Array<GoogleAutocompleteSuggestion> }>;
  };
  Place: new (options: { id: string }) => {
    addressComponents?: Array<google.maps.GeocoderAddressComponent>;
    formattedAddress?: string;
    id?: string;
    fetchFields(options: { fields: Array<string> }): Promise<void>;
  };
};

function getPlacesLibrary(): GooglePlacesLibrary {
  return window.google.maps.places as unknown as GooglePlacesLibrary;
}

export async function getPlacePredictions(
  searchText: string,
  includedPrimaryTypes: Array<string>,
): Promise<Array<PlacePrediction>> {
  if (!searchText.trim()) {
    return [];
  }

  const predictionRequest: AutocompleteSuggestionRequest = {
    input: searchText,
  };

  if (includedPrimaryTypes.length > 0) {
    const validTypes = includedPrimaryTypes.filter(
      (type) =>
        type !== 'address' &&
        type !== 'geocode' &&
        type !== '(regions)' &&
        type !== '(cities)',
    );

    if (validTypes.length > 0) {
      predictionRequest.includedPrimaryTypes = validTypes;
    }
  }

  const response =
    await getPlacesLibrary().AutocompleteSuggestion.fetchAutocompleteSuggestions(
      predictionRequest,
    );

  if (!response.suggestions || response.suggestions.length === 0) {
    return [];
  }

  return response.suggestions.map((suggestion) => ({
    place_id: suggestion.placePrediction.placeId,
    description: suggestion.placePrediction.text?.toString() || '',
    structured_formatting: {
      main_text:
        suggestion.placePrediction.structuredFormat?.mainText?.toString() ||
        suggestion.placePrediction.text?.toString() ||
        '',
      secondary_text:
        suggestion.placePrediction.structuredFormat?.secondaryText?.toString() ||
        '',
    },
  }));
}

export async function getPlaceDetails(
  placeId: string,
): Promise<google.maps.places.PlaceResult> {
  try {
    const places = getPlacesLibrary();

    const place = new places.Place({
      id: placeId,
    });

    await place.fetchFields({
      fields: ['addressComponents', 'formattedAddress', 'id'],
    });

    return {
      address_components: place.addressComponents,
      formatted_address: place.formattedAddress,
      place_id: place.id,
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
}

export function formatStructuredAddress(
  place: google.maps.places.PlaceResult,
): IStructuredAddress {
  const components: Record<string, string> = {};

  if (place.address_components) {
    place.address_components.forEach(
      (component: google.maps.GeocoderAddressComponent) => {
        const type = component.types[0];
        components[type] = component.long_name;
      },
    );
  }

  return {
    formatted_address: place.formatted_address || '',
    street_number: components.street_number,
    route: components.route,
    locality: components.locality,
    administrative_area_level_1: components.administrative_area_level_1,
    country: components.country,
    postal_code: components.postal_code,
    place_id: place.place_id || '',
  };
}

export function formatAddressString(
  place: google.maps.places.PlaceResult,
): string {
  return place.formatted_address || '';
}
