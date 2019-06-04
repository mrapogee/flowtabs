import { Observable, merge, from, combineLatest } from "rxjs";
import {
  switchMap,
  startWith,
  concat,
  map,
  filter,
  take
} from "rxjs/operators";
import {
  ChromeTab,
  ChromeWindow,
  FlowWindowStateSet,
  WindowMappings,
  WindowFlowState
} from "../interfaces";
import * as uuid from "uuid";

// TODO improve windows performance

const SAVED_WINDOWS_KEY = "com.samdesota.flowTabs_savedWindows_v1";
const LOCAL_WINDOWS_KEY = "com.samdesota.flowTabs_localWindows_v1";
const WINDOW_MAPPINGS_KEY = "com.samdesota.flowTabs_windowMappings_v1";

export const defaultState: WindowFlowState = {
  stateId: null,
  windowId: null,
  name: "",
  sync: false,
  saved: false
};

export const getDefaultState = (window: ChromeWindow) => {
  return {
    stateId: null,
    windowId: window.id,
    name: "",
    sync: false,
    saved: false
  } as WindowFlowState;
};

export const deleteSavedWindow = async (state: WindowFlowState) => {
  const savedStateSet = await getChromeStorage<FlowWindowStateSet>(
    "sync",
    SAVED_WINDOWS_KEY,
    {}
  );
  const id = state.stateId as string;

  delete savedStateSet[id];

  chrome.storage.sync.set({ [SAVED_WINDOWS_KEY]: savedStateSet });
};

export const saveLocalWindowState = async (state: WindowFlowState) => {
  await updateWindowState({
    ...state,
    tabs: state.tabs!.map(tab => ({ ...tab, id: uuid.v4() })),
    stateId: uuid.v4(),
    saved: true,
    sync: true
  });
};

export const updateWindowState = async (state: WindowFlowState) => {
  const key = state.saved ? SAVED_WINDOWS_KEY : LOCAL_WINDOWS_KEY;
  const type = state.saved ? ("sync" as "sync") : ("local" as "local");

  const stateSet = await getChromeStorage<FlowWindowStateSet>(type, key, {});
  const mappings = await getChromeStorage<WindowMappings>(
    "local",
    WINDOW_MAPPINGS_KEY,
    {}
  );

  state.stateId = state.stateId || uuid.v4();
  stateSet[state.stateId] = state;
  chrome.storage[type].set({
    [key]: stateSet
  });

  if (!state.saved && state.windowId) {
    mappings[state.windowId] = state.stateId;

    chrome.storage.local.set({
      [WINDOW_MAPPINGS_KEY]: mappings
    });
  }
};

const getTabs = (windowId: number) => {
  return new Promise<ChromeTab[]>(resolve => {
    chrome.tabs.query({ windowId }, tabs =>
      resolve(
        tabs
          .filter(tab => tab.id != null && tab.url != null)
          .map(tab => ({
            id: tab.id as number,
            url: tab.url as string,
            title: tab.title as string,
            favIconUrl: tab.favIconUrl || null,
            windowId: tab.windowId
          }))
      )
    );
  });
};

const getWindowsAsync = () => {
  return new Promise<ChromeWindow[]>(resolve => {
    chrome.windows.getAll(windows =>
      Promise.all(
        windows
          .filter(window => window.type === "normal")
          .map(async window => ({
            id: window.id,
            active: true,
            tabs: await getTabs(window.id)
          }))
      ).then(resolve)
    );
  });
};

const fromChromeEvent = <V extends any[]>(
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

const events = [
  chrome.windows.onRemoved,
  chrome.windows.onCreated,
  chrome.tabs.onUpdated,
  chrome.tabs.onRemoved,
  chrome.tabs.onCreated,
  chrome.tabs.onMoved
];

const getChromeStorage = <V>(
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

const getActiveChromeStorage = <T>(
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

export const getWindows = () => {
  const update$ = merge<any>(
    ...events.map(e => fromChromeEvent(e as chrome.events.Event<any>))
  ).pipe(startWith(null));

  const activeWindows$ = update$.pipe(switchMap(getWindowsAsync));

  const savedState$ = getActiveChromeStorage<FlowWindowStateSet>(
    "sync",
    SAVED_WINDOWS_KEY,
    {}
  );

  const instanceState$ = getActiveChromeStorage<FlowWindowStateSet>(
    "local",
    LOCAL_WINDOWS_KEY,
    {}
  );

  const windowMappings$ = getActiveChromeStorage<WindowMappings>(
    "local",
    WINDOW_MAPPINGS_KEY,
    {}
  );

  const collectGarbage$ = combineLatest(
    instanceState$,
    windowMappings$,
    activeWindows$,
    (instanceState, mappings, activeWindows) => {
      const windowIds = new Set(activeWindows.map(window => String(window.id)));
      const newMappings: WindowMappings = {};
      const newInstanceState: FlowWindowStateSet = {};

      Object.keys(mappings).forEach(windowId => {
        if (windowIds.has(windowId)) {
          const value = mappings[windowId];
          newMappings[windowId] = value;

          if (instanceState.hasOwnProperty(value)) {
            newInstanceState[value] = instanceState[value];
          }
        }
      });

      chrome.storage.local.set({
        [WINDOW_MAPPINGS_KEY]: newMappings,
        [LOCAL_WINDOWS_KEY]: newInstanceState
      });
    }
  ).pipe(
    take(1),
    filter(() => false)
  );

  const windows$ = combineLatest(
    windowMappings$,
    activeWindows$,
    savedState$,
    instanceState$,

    (mappings, activeWindows, savedState, instanceState) => {
      const windowsWithState = activeWindows.map(window =>
        mappings.hasOwnProperty(window.id)
          ? {
              ...window,
              state: instanceState[mappings[window.id]]
            }
          : window
      );

      const otherSavedWindows = Array.from(Object.keys(savedState)).map(key => {
        const state = savedState[key];

        return {
          id: state.stateId as string,
          active: false,
          state,
          tabs: state.tabs || []
        };
      });

      return [...windowsWithState, ...otherSavedWindows];
    }
  );

  return merge(collectGarbage$, windows$);
};
