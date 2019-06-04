import * as React from "react";
import styled from "styled-components";
import { WindowTask } from "./WindowTask";
import { PopupHeader } from "./PopupHeader";
import { getWindows } from "../lib/getWindows";
import { getCurrentWindow } from "../lib/getCurrentWindow";
import { searchWindows, bringCurrentToFront } from "../lib/searchTools";
import {
  WindowState,
  TabQuery,
  SearchContent,
  ChromeTab,
  ChromeWindow,
  TabOrderQuery,
  TabOrderPreviewQuery,
  TypeOrderCommitQuery,
  BID
} from "../interfaces";
import { TabPreview } from "./TabPreview";
import { TabList } from "./TabList";
import { findMap } from "../lib/findMap";
import { defaultQuery } from "../lib/queries";
import { oc } from "ts-optchain";
import {
  commitRearrangeTabs,
  activateTab,
  activateWindow,
  updateWindowState,
  defaultState
} from "../lib/chromeActions";
import { useObservable, useSubject } from "../lib/rxHooks";
import {
  combineLatest,
  Observable,
  fromEvent,
  merge,
  of,
  empty,
  concat
} from "rxjs";
import {
  filter,
  switchMap,
  withLatestFrom,
  map,
  mergeMap,
  take,
  shareReplay,
  startWith,
  distinctUntilChanged,
  share,
  tap
} from "rxjs/operators";
import { PopupDragLayer } from "./PopupDragLayer";
import { rearrangeTab } from "../lib/windowUtils";

const PopupContainer = styled.div`
  width: 600px;
  height: 600px;
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

const addNewTask = (name: string) => {
  chrome.windows.create(window => {
    if (window != null) {
      updateWindowState({
        ...defaultState,
        name,
        windowId: window.id
      });
    }
  });
};

const makePopupState = (
  query$: Observable<TabQuery>,
  updateTabSelection$: Observable<BID | null>,
  updateWindowSelection$: Observable<BID | null>,
  rearrangeTab$: Observable<TabOrderQuery>
) => {
  const windows$ = getWindows().pipe(shareReplay(1));
  const currentWindow$ = getCurrentWindow().pipe(shareReplay(1));
  const keydown$ = fromEvent<KeyboardEvent>(document.body, "keydown");

  const matchedWindows$ = combineLatest(
    query$,
    windows$,
    currentWindow$,
    (query, windows, currentWindow) => {
      return windows == null ? [] : searchWindows(windows, query);
    }
  ).pipe(shareReplay(1));

  const whenQueryContent = function<V>(
    content: SearchContent,
    get: () => Observable<V>
  ) {
    return query$.pipe(
      switchMap(query => {
        if (query.type === "search" && query.content === content) {
          return get();
        }

        return of(null);
      })
    );
  };

  const moveWindowBy = (by: number) => {
    return matchedWindows$.pipe(
      withLatestFrom(selectedWindow$, (matchedWindows, selected) => {
        if (selected === null) {
          return matchedWindows.length && matchedWindows[0].id;
        } else {
          return (
            findMap(matchedWindows, (window, index) => {
              if (window.id === selected) {
                return oc(matchedWindows[index + by]).id(selected);
              }
              return undefined;
            }) || null
          );
        }
      }),
      take(1)
    );
  };

  const selectedWindow$: Observable<BID | null> = whenQueryContent(
    "tasks",
    () =>
      merge(
        updateWindowSelection$,
        keydown$.pipe(
          mergeMap(event => {
            if (event.key === "ArrowDown") {
              return moveWindowBy(1);
            }
            if (event.key === "ArrowUp") {
              return moveWindowBy(-1);
            }

            return empty();
          })
        ),
        query$.pipe(
          mergeMap(() =>
            matchedWindows$.pipe(
              take(1),
              map(windows => oc(windows)[0].id() || null)
            )
          )
        )
      )
  ).pipe(
    startWith(null),
    shareReplay(1)
  );

  const moveTabBy = (by: number) => {
    return matchedWindows$.pipe(
      withLatestFrom(selectedTab$, (matchedWindows, selected) => {
        if (selected === null) {
          return oc(matchedWindows)[0].tabs[0].id() || null;
        } else {
          const tabs = matchedWindows.flatMap(
            window => window.tabs as ChromeTab[]
          );

          return (
            findMap(tabs, (tab, index) =>
              tab.id === selected
                ? oc(tabs[index + by]).id(selected)
                : undefined
            ) || null
          );
        }
      }),
      take(1)
    );
  };

  const selectedTab$: Observable<null | BID> = whenQueryContent("tabs", () =>
    merge(
      updateTabSelection$,
      keydown$.pipe(
        mergeMap(event => {
          if (event.key === "ArrowDown") {
            return moveTabBy(1);
          }
          if (event.key === "ArrowUp") {
            return moveTabBy(-1);
          }

          return empty();
        })
      ),
      query$.pipe(
        mergeMap(() =>
          matchedWindows$.pipe(
            take(1),
            map(windows => oc(windows)[0].tabs[0].id() || null)
          )
        )
      )
    )
  ).pipe(
    startWith(null),
    shareReplay(1)
  );

  const rearrangeTabPreview$ = rearrangeTab$.pipe(
    filter((query): query is TabOrderPreviewQuery => query.type === "preview")
  );

  const windowsWithArrangement$ = matchedWindows$
    .pipe(
      switchMap(windows => {
        return merge(
          of(windows),
          rearrangeTabPreview$.pipe(
            filter(query => query.siblingId !== query.tab.id),
            distinctUntilChanged(
              (x, y) =>
                x.tab.id === y.tab.id &&
                x.windowId === y.windowId &&
                x.siblingId === y.siblingId &&
                x.by === y.by
            ),
            map(query => rearrangeTab(query, windows))
          )
        );
      })
    )
    .pipe(share());

  const effects$ = merge(
    rearrangeTab$.pipe(
      filter((query): query is TypeOrderCommitQuery => query.type === "commit"),
      withLatestFrom(
        windows$,
        windowsWithArrangement$,
        (commit, windows, arrangedWindows) => {
          const query = findMap(arrangedWindows, window => {
            return findMap(window.tabs, (tab, index) => {
              if (tab.id === commit.tabId) {
                const atEnd = window.tabs.length === index + 1;

                if (window.tabs.length === 1) {
                  return {
                    type: "preview" as "preview",
                    windowId: window.id,
                    siblingId: null,
                    tab,
                    by: 0
                  };
                }

                return {
                  type: "preview" as "preview",
                  windowId: window.id,
                  siblingId: atEnd
                    ? window.tabs[index - 1].id
                    : window.tabs[index + 1].id,
                  tab,
                  by: atEnd ? 1 : 0
                };
              }
            });
          });

          if (query != null) {
            const from = findMap(windows, window =>
              findMap(window.tabs, tab =>
                tab.id === query.tab.id ? window.state || null : undefined
              )
            );

            const to = windows.find(window => query.windowId === window.id);

            commitRearrangeTabs(from!, to!.state!, query);
          }
        }
      )
    ),
    keydown$.pipe(
      filter(event => event.key === "Enter"),
      withLatestFrom(
        query$,
        selectedTab$,
        selectedWindow$,
        windows$,
        (event, query, selectedTab, selectedWindow, windows) => {
          if (query.type === "addWindow") {
            addNewTask(query.name.trim());
          } else if (query.type === "search") {
            if (query.content === "tabs" && selectedTab != null) {
              const result = findMap(windows, window =>
                findMap(window.tabs, tab =>
                  tab.id === selectedTab ? { tab, window } : undefined
                )
              );

              if (result != null) {
                activateTab(result.window, result.tab);
              }
            }
            if (query.content === "tasks" && selectedWindow != null) {
              const window = windows.find(
                window => window.id === selectedWindow
              );

              if (window != null) {
                activateWindow(window);
              }
            }
          }
        }
      )
    )
  );

  return combineLatest([
    windowsWithArrangement$,
    currentWindow$,
    selectedTab$,
    selectedWindow$,
    effects$.pipe(startWith(null))
  ]);
};

export const Popup = () => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollTo, setScrollTo] = React.useState(null as null | BID);

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

  const showTabs = (window: ChromeWindow) => {
    setQuery({
      type: "search",
      scope: query.type === "search" ? query.scope : "active",
      content: "tabs",
      query: ""
    });
    setScrollTo(window.id);
  };

  const [query, setQuery] = React.useState(defaultQuery as TabQuery);
  const [onChangeTabSelection, updateTabSelection$] = useSubject<BID | null>();
  const [
    onChangeWindowSelection,
    updateWindowSelection$
  ] = useSubject<BID | null>();
  const [onRearrangeTab, rearrangeTab$] = useSubject<TabOrderQuery>();

  const [
    matchedWindows = [],
    currentWindow = null,
    selectedTab = null,
    selectedWindow = null
  ] =
    useObservable(
      makePopupState,
      query,
      updateTabSelection$,
      updateWindowSelection$,
      rearrangeTab$
    ) || [];

  return (
    <PopupContainer>
      <PopupDragLayer />
      <PopupHeader query={query} onChangeQuery={setQuery} />
      <ScrollContainer ref={scrollRef}>
        <WindowsContainer>
          {matchedWindows.map(window => {
            return (
              <WindowTask
                key={window.id}
                current={currentWindow === window.id}
                selected={selectedWindow === window.id}
                onMouseMove={() => {
                  return (
                    selectedWindow !== window.id &&
                    onChangeWindowSelection(window.id)
                  );
                }}
                onMouseLeave={() => onChangeWindowSelection(null)}
                onChangeState={state => updateWindowState(state)}
                window={window}
              >
                {query.type === "search" && query.content === "tabs" ? (
                  <TabList
                    onRearrangeTab={onRearrangeTab}
                    onSelectTab={onChangeTabSelection}
                    selectedTab={selectedTab}
                    window={window}
                  />
                ) : (
                  <TabPreview
                    onRearrangeTab={onRearrangeTab}
                    maxTabs={3}
                    window={window}
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
