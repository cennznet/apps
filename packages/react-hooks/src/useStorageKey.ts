import store from 'store';

// create a chain-specific key for the local storage
// like [[useCacheKey]] minus any internal api hook/calls allowing it to be used more widely by react
export default function useStorageKey <T> (genesisHash: string | undefined, storageKeyBase: string): [(defaultValue?: T) => T | undefined, (value: T) => T] {
    const STORAGE_KEY = `${storageKeyBase}:${genesisHash || 'development'}`;
  
    return [
      (): T | undefined => store.get(STORAGE_KEY),
      (value: T): T => store.set(STORAGE_KEY, value)
    ];
  }