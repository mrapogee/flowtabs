import {
  TabQuery,
  WindowState,
  ChromeWindow,
  SearchScope
} from "../interfaces";
import { oc } from "ts-optchain";
const fuzzyMatch = require("fuzzysearch");

(window as any).fuzzyMatch = fuzzyMatch;

const getDomain = (url: string) => {
  return new URL(url).hostname.split(".").slice(-2)[0];
};

const getWindowsInScope = (scope: SearchScope, windows: ChromeWindow[]) => {
  if (scope === "active") {
    return windows.filter(window => window.active);
  }

  if (scope === "saved") {
    return windows.filter(window => oc(window).state.saved(false));
  }

  return windows;
};

export const searchWindows = (windows: ChromeWindow[], query: TabQuery) => {
  if (query.type === "addWindow") {
    return windows.filter(window => window.active);
  }

  if (query.type === "search") {
    const queryText = query.query.toLowerCase();
    const scopedWindows = getWindowsInScope(query.scope, windows);

    if (queryText === "") {
      return scopedWindows;
    }

    if (query.content === "tasks") {
      return scopedWindows.filter(window => {
        const { state } = window;
        if (state != null) {
          const { name } = state;

          return fuzzyMatch(queryText, name.toLowerCase());
        }

        return false;
      });
    } else if (query.content === "tabs") {
      return scopedWindows
        .map(window => {
          return {
            ...window,
            tabs:
              window.tabs &&
              window.tabs.filter(
                tab =>
                  tab.title != null &&
                  tab.url != null &&
                  (fuzzyMatch(queryText, tab.title.toLowerCase()) ||
                    fuzzyMatch(queryText, getDomain(tab.url)))
              )
          };
        })
        .filter(window => window.tabs && window.tabs.length > 0);
    }
  }

  return windows;
};

export const bringCurrentToFront = (
  currentWindow: number | null,
  windows: ChromeWindow[]
) => {
  if (currentWindow == null) {
    return windows;
  }

  const targetIndex = windows.findIndex(window => window.id === currentWindow);

  if (targetIndex === -1) {
    return windows;
  }

  return [
    windows[targetIndex],
    ...windows.slice(0, targetIndex),
    ...windows.slice(targetIndex + 1)
  ];
};
