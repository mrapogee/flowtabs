import {
  TabOrderPreviewQuery,
  ChromeWindow,
  ChromeTab,
  WindowFlowState,
  BID,
  FlowWindowStateSet,
  WindowMappings
} from "../interfaces";
import {
  SAVED_WINDOWS_KEY,
  LOCAL_WINDOWS_KEY,
  WINDOW_MAPPINGS_KEY
} from "./getWindows";
import uuid = require("uuid");
import { getChromeStorage } from "./chromeStorage";

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

  await new Promise(resolve =>
    chrome.storage.sync.set({ [SAVED_WINDOWS_KEY]: savedStateSet }, resolve)
  );
};

export const saveLocalWindowState = async (state: WindowFlowState) => {
  const stateId = uuid.v4();

  await updateWindowState({
    ...state,
    tabs: state.tabs!.map(tab => ({
      ...tab,
      id: uuid.v4(),
      windowId: stateId
    })),
    windowId: stateId,
    stateId,
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

  const stateId = state.stateId || uuid.v4();
  const windowId = state.saved ? stateId : state.windowId;

  const newState = {
    ...state,
    stateId,
    windowId,
    tabs: state.tabs && state.tabs.map(tab => ({ ...tab, windowId }))
  } as WindowFlowState;

  stateSet[stateId] = newState;

  await new Promise(resolve =>
    chrome.storage[type].set(
      {
        [key]: stateSet
      },
      resolve
    )
  );

  if (!state.saved && state.windowId) {
    mappings[newState.windowId as number] = stateId;

    await new Promise(resolve =>
      chrome.storage.local.set(
        {
          [WINDOW_MAPPINGS_KEY]: mappings
        },
        resolve
      )
    );
  }
};

export const removeTab = (state: WindowFlowState, id: BID) => {
  if (state.saved && state.tabs) {
    const newTabs = state.tabs.filter(tab => tab.id !== id);

    if (newTabs.length === 0) {
      return deleteSavedWindow(state);
    }

    return updateWindowState({
      ...state,
      tabs: newTabs
    });
  }

  return new Promise(resolve => chrome.tabs.remove(id as number, resolve));
};

export const addTabToSavedWindow = (
  state: WindowFlowState,
  query: TabOrderPreviewQuery
) => {
  const tabs = state.tabs!.filter(tab => tab.id !== query.tab.id);
  const siblingIndex = tabs.findIndex(tab => tab.id === query.siblingId);
  const targetIndex = Math.min(
    Math.max(0, siblingIndex + query.by),
    tabs.length + 1
  );

  return updateWindowState({
    ...state,
    tabs: [
      ...tabs.slice(0, targetIndex),
      { ...query.tab, id: uuid.v4() },
      ...tabs.slice(targetIndex)
    ]
  });
};

export const commitRearrangeTabs = async (
  from: WindowFlowState,
  to: WindowFlowState,
  query: TabOrderPreviewQuery
) => {
  if ((from.saved || to.saved) && from.stateId !== to.stateId) {
    await removeTab(from, query.tab.id);
  }

  if (to.saved) {
    return addTabToSavedWindow(to, query);
  }

  return new Promise(resolve => {
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

        if (from.saved) {
          chrome.tabs.create(
            {
              windowId: query.windowId as number,
              index: targetIndex,
              url: query.tab.url,
              selected: false
            },
            resolve
          );
        } else {
          chrome.tabs.move(
            query.tab.id as number,
            {
              windowId: windowId,
              index: targetIndex + correction
            },
            resolve
          );
        }
      }
    });
  });
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
    chrome.windows.update(tab.windowId as number, { focused: true });
  } else {
    chrome.tabs.create({ url: tab.url });
  }
};
