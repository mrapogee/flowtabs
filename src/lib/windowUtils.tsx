import {
  TabOrderQuery,
  ChromeWindow,
  ChromeTab,
  RectCorner,
  TabOrderPreviewQuery
} from "../interfaces";

export const rearrangeTab = (
  query: TabOrderPreviewQuery,
  windows: ChromeWindow[]
) => {
  return windows.map(window => {
    if (window.id === query.tab.windowId) {
      window = {
        ...window,
        tabs: window.tabs.filter(tab => tab.id !== query.tab.id)
      };
    }

    if (window.id === query.windowId) {
      const siblingIndex = window.tabs.findIndex(
        tab => tab.id === query.siblingId
      );

      if (siblingIndex === -1) {
        return window;
      }

      return {
        ...window,
        tabs: [
          ...window.tabs.slice(0, siblingIndex + query.by),
          query.tab,
          ...window.tabs.slice(siblingIndex + query.by)
        ]
      };
    }

    return window;
  });
};

export const handleTabRearrangment = (
  axis: "x" | "y",
  index: number,
  tab: ChromeTab,
  callback: (query: TabOrderQuery) => void
) => (corner: RectCorner, hoverTab: ChromeTab) => {
  const targetCorner = axis === "x" ? "right" : "bottom";

  if (corner[axis] === targetCorner) {
    callback({
      type: "preview",
      windowId: tab.windowId,
      siblingId: tab.id,
      tab: hoverTab,
      by: 1
    });
  } else if (index === 0) {
    callback({
      type: "preview",
      windowId: tab.windowId,
      siblingId: tab.id,
      tab: hoverTab,
      by: 0
    });
  }
};
