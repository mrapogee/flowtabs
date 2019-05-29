import * as React from "react";
import styled from "styled-components";
import { WindowTask } from "./WindowTask";
import { PopupHeader } from "./PopupHeader";
import { useWindows } from "../hooks/useWindows";
import { useCurrentWindow } from "../hooks/useCurrentWindow";
import { searchWindows, bringCurrentToFront } from "../lib/searchTools";
import { WindowState, TabQuery, SearchQuery } from "../interfaces";
import { TabPreview } from "./TabPreview";
import { TabList } from "./TabList";
import { findMap } from "../lib/findMap";
import { defaultQuery } from "../lib/queries";
import { oc } from "ts-optchain";
import { showTab, showWindow } from "../lib/chromeActions";

interface Props {
  initialWindowsState: WindowState;
}

const PopupContainer = styled.div`
  width: 600px;
  max-height: 600px;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: stretch;
  flex-direction: column;
  color: #2d2d2d;
`;

const ScrollContainer = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  background-color: #f9f9f9;
`;

const WindowsContainer = styled.div`
  &&& {
    > * {
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    }
  }
`;

const persistNewWindowState = (state: WindowState) => {
  localStorage.setItem("tabontask-active-tabs", JSON.stringify(state.toJS()));
};

const addNewTask = (name: string, state: WindowState) => {
  chrome.windows.create(window => {
    if (window != null) {
      persistNewWindowState(
        state.set(window.id, {
          savedTaskId: null,
          taskName: name
        })
      );
    }
  });
};

export const Popup = ({ initialWindowsState }: Props) => {
  const windows = useWindows();

  const currentWindow = useCurrentWindow();
  const [windowState, setWindowReactState] = React.useState<WindowState>(
    initialWindowsState
  );

  const setWindowState = (state: WindowState) => {
    setWindowReactState(state);
    persistNewWindowState(state);
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollTo, setScrollTo] = React.useState(null as null | number);
  React.useEffect(() => {
    if (
      matchedWindows != null &&
      scrollTo != null &&
      scrollRef.current != null
    ) {
      const index = matchedWindows.findIndex(window => window.id === scrollTo);

      if (index != -1) {
        const scrollTarget = (scrollRef.current.firstChild as HTMLElement)
          .children[index] as HTMLElement;
        scrollRef.current.scrollTo({
          top: scrollTarget.offsetTop - scrollRef.current.offsetTop
        });
      }
      setScrollTo(null);
    }
  }, [scrollTo]);

  const showTabs = (window: chrome.windows.Window) => {
    setQuery({
      type: "search",
      scope: query.type === "search" ? query.scope : "active",
      content: "tabs",
      query: ""
    });
    setScrollTo(window.id);
  };

  const [query, setQuery] = React.useState(defaultQuery as TabQuery);
  const [selected, setSelected] = React.useState(null as null | number);

  const matchedWindows =
    windows == null
      ? []
      : searchWindows(
          bringCurrentToFront(currentWindow, windows),
          windowState,
          query
        );

  if (windows == null) {
    return null;
  }

  const isTaskSearch = query.type !== "search" || query.content === "tasks";
  const isTabSearch = query.type === "search" && query.content === "tabs";

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const moveSelection = (by: number, query: SearchQuery) => {
      if (query.content === "tasks") {
        if (selected === null) {
          matchedWindows.length && setSelected(matchedWindows[0].id);
        } else {
          return setSelected(
            findMap(matchedWindows, (window, index) => {
              if (window.id === selected) {
                return oc(matchedWindows[index + by]).id(selected);
              }
              return undefined;
            }) || null
          );
        }
      } else {
        if (selected === null) {
          matchedWindows.length &&
            matchedWindows[0].tabs &&
            setSelected(matchedWindows[0].tabs[0].id || null);
        } else {
          const tabs = matchedWindows.flatMap(
            window => window.tabs as chrome.tabs.Tab[]
          );

          return setSelected(
            findMap(tabs, (tab, index) =>
              tab.id === selected
                ? oc(tabs[index + by]).id(selected)
                : undefined
            ) || null
          );
        }
      }
    };

    if (e.key === "Enter") {
      if (query.type === "addWindow") {
        addNewTask(query.name.trim(), windowState);
      } else if (query.type == "search") {
        if (selected != null) {
          if (query.content === "tabs") {
            showTab(selected);
          } else {
            showWindow(selected);
          }
        }
      }
    } else if (e.key === "ArrowDown") {
      if (query.type === "search") {
        moveSelection(1, query);
      }
    } else if (e.key === "ArrowUp") {
      if (query.type === "search") {
        moveSelection(-1, query);
      }
    }
  };

  return (
    <PopupContainer>
      <PopupHeader
        onSearchKeyDown={onSearchKeyDown}
        windows={matchedWindows}
        windowState={windowState}
        query={query}
        onChangeQuery={setQuery}
      />
      <ScrollContainer ref={scrollRef}>
        <WindowsContainer>
          {matchedWindows.map(window => {
            const tabs = (window.tabs as chrome.tabs.Tab[]).filter(
              tab => tab.title != null
            );

            return (
              <WindowTask
                key={window.id}
                current={currentWindow === window.id}
                selected={isTaskSearch && selected === window.id}
                state={
                  windowState.get(window.id) || {
                    savedTaskId: null,
                    taskName: ""
                  }
                }
                onMouseEnter={() => isTaskSearch && setSelected(window.id)}
                onChangeState={state =>
                  setWindowState(windowState.set(window.id, state))
                }
                window={window}
              >
                {query.type === "search" && query.content === "tabs" ? (
                  <TabList
                    onSelectTab={id => setSelected(id)}
                    selectedTab={isTabSearch ? selected : null}
                    tabs={tabs}
                  />
                ) : (
                  <TabPreview
                    maxTabs={3}
                    tabs={tabs}
                    onShowTabs={() => showTabs(window)}
                  />
                )}
              </WindowTask>
            );
          })}
        </WindowsContainer>
      </ScrollContainer>
    </PopupContainer>
  );
};
