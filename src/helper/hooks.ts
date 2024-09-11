import { useCallback, useEffect, useRef, useState } from "react";

// See https://usehooks.com/useLocalStorage
export const useLocalStorage = <T>(key: string, initialValue: T) => {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);
            // Parse stored json or if none return initialValue
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // If error also return initialValue
            return initialValue;
        }
    });
    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                // to trigger the event in the tab changing the localStorage
                const event = new StorageEvent("storage", {
                    key: key,
                    newValue: JSON.stringify(valueToStore),
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            // A more advanced implementation would handle the error case
            console.log(error);
        }
    };
    return [storedValue, setValue] as const;
};

export const useInterval = (callback: Function, delay: number) => {
    const savedCallback = useRef<Function>();
    const intervalIdRef = useRef<number>();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            if (savedCallback.current) {
                savedCallback.current();
            }
        }
        if (delay !== null) {
            intervalIdRef.current = setInterval(tick, delay);
            const id = intervalIdRef.current;
            return () => {
                clearInterval(id);
            };
        }
    }, [delay]);

    useEffect(() => {
        const id = intervalIdRef.current;
        return () => {
            clearInterval(id);
        };
    }, []);

    return useCallback(() => {
        clearInterval(intervalIdRef.current);
        if (savedCallback.current) {
            intervalIdRef.current = setInterval(savedCallback.current, delay);
        }
    }, [delay]);
};

export const withStorageDOMEvents = (store: any) => {
    const storageEventCallback = (e: StorageEvent) => {
        if (store.persist && e.key === store.persist.getOptions().name && e.newValue) {
            store.persist.rehydrate();
        }
    };

    window.addEventListener("storage", storageEventCallback);

    return () => {
        window.removeEventListener("storage", storageEventCallback);
    };
};