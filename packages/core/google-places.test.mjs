import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlacePredictions } from './src/components/declarative-form/fields/address/google-places.ts';

test('distinguishes an empty search from an SDK failure', async () => {
  assert.deepEqual(await getPlacePredictions('  ', []), []);

  const originalWindow = globalThis.window;
  globalThis.window = {
    google: {
      maps: {
        places: {
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: async () => {
              throw new Error('SDK unavailable');
            },
          },
        },
      },
    },
  };

  try {
    await assert.rejects(getPlacePredictions('Berlin', []), /SDK unavailable/);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});
