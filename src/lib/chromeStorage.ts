import { Observable, from } from "rxjs";
import { concat, map, filter } from "rxjs/operators";

export const fromChromeEvent = <V extends any[]>(
  event: chrome.events.Event<(...v: V) => void>
): Observable<V> => {
  return new Observable(sink => {
    const listener = (...next: V) => sink.next(next);
    event.addListener(listener);

    return {
      unsubscribe() {
        event.removeListener(listener);
      }
    };
  });
};

export const getChromeStorage = <V>(
  type: "local" | "sync",
  key: string,
  defaultValue: V
) => {
  return new Promise<V>(resolve =>
    chrome.storage[type].get(key, item => {
      const value = item[key];

      if (item[key] === undefined) {
        resolve(defaultValue);
      } else {
        resolve(item[key]);
      }
    })
  );
};

export const getActiveChromeStorage = <T>(
  type: "local" | "sync",
  key: string,
  defaultValue: T
) => {
  const changed$ = fromChromeEvent(chrome.storage.onChanged);
  const updates$ = changed$.pipe(
    filter(
      ([change, namespace]) => namespace === type && change.hasOwnProperty(key)
    ),
    map(([change]) => {
      const newValue = change[key].newValue;

      if (newValue === undefined) {
        return defaultValue;
      }

      return newValue as T;
    })
  );

  return from(getChromeStorage<T>(type, key, defaultValue)).pipe(
    concat(updates$)
  );
};
