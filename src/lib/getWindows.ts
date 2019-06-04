import { merge, combineLatest, Observable } from "rxjs";
import { switchMap, startWith, filter, take } from "rxjs/operators";
import {
  ChromeTab,
  ChromeWindow,
  FlowWindowStateSet,
  WindowMappings,
  WindowFlowState
} from "../interfaces";
import * as uuid from "uuid";
import { getActiveChromeStorage, fromChromeEvent } from "./chromeStorage";

// TODO improve windows performance

export const SAVED_WINDOWS_KEY = "com.samdesota.flowTabs_savedWindows_v1";
export const LOCAL_WINDOWS_KEY = "com.samdesota.flowTabs_localWindows_v1";
export const WINDOW_MAPPINGS_KEY = "com.samdesota.flowTabs_windowMappings_v1";

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

const events = [
  chrome.windows.onRemoved,
  chrome.windows.onCreated,
  chrome.tabs.onUpdated,
  chrome.tabs.onRemoved,
  chrome.tabs.onCreated,
  chrome.tabs.onMoved
];

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
  ) as Observable<never>;

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
