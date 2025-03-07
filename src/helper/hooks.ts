import React, { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { isArray } from "lodash";

export type LongpressEvent = MouseEvent | React.TouchEvent;

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

export const useLongPress = (
    onLongPress: (e: LongpressEvent) => void,
    onClick: (e: LongpressEvent) => void,
    delay: number = 300,
    shouldPreventDefault: boolean = true,
) => {
    const [longPressTriggered, setLongPressTriggered] = useState<boolean>(false);
    const [longPressStarted, setLongPressStarted] = useState<boolean>(false);
    const timeout = useRef<number>();
    const target = useRef<EventTarget>();

    const start = useCallback(
        (event: LongpressEvent) => {
            setLongPressStarted(true);
            if (shouldPreventDefault && event.target) {
                event.target.addEventListener("touchend", preventDefault, {
                    passive: false,
                });
                (event.target as HTMLElement).classList.add("pressing");
                target.current = event.target;
            }
            timeout.current = setTimeout(() => {
                onLongPress(event);
                (event.target as HTMLElement).classList.remove("pressing");
                setLongPressTriggered(true);
                setLongPressStarted(false);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault],
    );

    const clear = useCallback(
        (event: LongpressEvent, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current);
            shouldTriggerClick && !longPressTriggered && longPressStarted && onClick(event);
            setLongPressTriggered(false);
            setLongPressStarted(false);
            (event.target as HTMLElement).classList.remove("pressing");
            if (shouldPreventDefault && target.current) {
                target.current.removeEventListener("touchend", preventDefault);
            }
        },
        [shouldPreventDefault, onClick, longPressTriggered],
    );

    return {
        onMouseDown: (e: MouseEvent) => start(e),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onMouseUp: (e: MouseEvent) => clear(e),
        onMouseLeave: (e: MouseEvent) => clear(e, false),
        onTouchEnd: (e: React.TouchEvent) => clear(e),
    };
};

const isTouchEvent = (event: Event) => {
    return "touches" in event;
};

const preventDefault = (event: Event) => {
    if (!isTouchEvent(event)) return;

    if (isArray(event.touches) && event.touches.length < 2 && event.preventDefault) {
        event.preventDefault();
    }
};
