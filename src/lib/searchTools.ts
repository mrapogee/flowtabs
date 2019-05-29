import { TabQuery, WindowState } from "../interfaces";
const fuzzyMatch = require("fuzzysearch");

(window as any).fuzzyMatch = fuzzyMatch;

const getDomain = (url: string) => {
  return new URL(url).hostname.split(".").slice(-2)[0];
};

export const searchWindows = (
  windows: chrome.windows.Window[],
  state: WindowState,
  query: TabQuery
) => {
  if (query.type === "addWindow") {
    return windows;
  }

  if (query.type === "search") {
    const queryText = query.query.toLowerCase();

    if (query.content === "tasks") {
      return windows.filter(window => {
        const windowState = state.get(window.id);

        if (windowState != null) {
          const { taskName } = windowState;

          return fuzzyMatch(queryText, taskName.toLowerCase());
        }

        return false;
      });
    } else if (query.content === "tabs") {
      return windows
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
  windows: chrome.windows.Window[]
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
