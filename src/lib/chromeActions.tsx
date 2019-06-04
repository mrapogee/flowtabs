import {
  TabOrderPreviewQuery,
  ChromeWindow,
  ChromeTab,
  WindowFlowState,
  BID
} from "../interfaces";
import { updateWindowState } from "../hooks/getWindows";
import uuid = require("uuid");

export const removeTab = (state: WindowFlowState, id: BID) => {
  if (state.saved && state.tabs) {
    updateWindowState({
      ...state,
      tabs: state.tabs.filter(tab => tab.id !== id)
    });
  }

  return chrome.tabs.remove(id as number);
};

export const updateSavedTab = (
  state: WindowFlowState,
  query: TabOrderPreviewQuery
) => {
  const tabs = state.tabs!.filter(tab => tab.id !== query.tab.id);
  const siblingIndex = tabs.findIndex(tab => tab.id === query.siblingId);
  const targetIndex = Math.min(
    Math.max(0, siblingIndex + query.by),
    tabs.length + 1
  );

  updateWindowState({
    ...state,
    tabs: [
      ...tabs.slice(0, targetIndex),
      { ...query.tab, id: uuid.v4() },
      ...tabs.slice(targetIndex)
    ]
  });
};

export const commitRearrangeTabs = (
  from: WindowFlowState,
  to: WindowFlowState,
  query: TabOrderPreviewQuery
) => {
  if (from.saved && from.stateId !== to.stateId) {
    removeTab(from, query.tab.id);
  }

  if (to.saved) {
    updateSavedTab(to, query);
  } else {
    chrome.tabs.query({ windowId: query.windowId as number }, tabs => {
      if (query.siblingId === null) {
        chrome.tabs.move(query.tab.id as number, {
          windowId: query.windowId as number,
          index: -1
        });
        return;
      }

      const siblingIndex = tabs.findIndex(tab => tab.id === query.siblingId);

      if (siblingIndex !== -1) {
        const { windowId } = tabs[siblingIndex];
        const targetIndex = Math.min(
          Math.max(0, siblingIndex + query.by),
          tabs.length
        );
        const currentTabIndex = tabs.findIndex(tab => tab.id === query.tab.id);
        const correction =
          currentTabIndex === -1 || currentTabIndex > targetIndex ? 0 : -1;

        chrome.tabs.move(query.tab.id as number, {
          windowId: windowId,
          index: targetIndex + correction
        });
      }
    });
  }
};

export const activateWindow = (window: ChromeWindow) => {
  if (window.active) {
    chrome.windows.update(window.id as number, { focused: true });
  } else {
    chrome.windows.create(
      { focused: true, url: window.tabs.map(tab => tab.url) },
      window => {
        console.log(window);
      }
    );
  }
};

export const activateTab = (window: ChromeWindow, tab: ChromeTab) => {
  if (window.active) {
    chrome.tabs.update(tab.id as number, { selected: true });
    chrome.windows.update(tab.windowId, { focused: true });
  } else {
    chrome.tabs.create({ url: tab.url });
  }
};
