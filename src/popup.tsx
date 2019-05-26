import * as React from "react";
import styled from "styled-components";
import { render } from "react-dom";
import { WindowTaskState } from "./interfaces";
import { WindowTask } from "./components/WindowTask";
import "semantic-ui-css/semantic.min.css";
import { Menu, Input, Segment } from "semantic-ui-react";
import { Map } from "immutable";
import { useWindows } from "./hooks/useWindows";
import { useCurrentWindow } from "./hooks/useCurrentWindow";

const PopupContainer = styled.div`
  width: 600px;
  background-color: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: stretch;
  flex-direction: column;
  color: #2d2d2d;
`;

const PaddedMenu = styled(Menu)`
  padding-left: 16px;
  padding-right: 16px;
  &&& {
    margin-bottom: 0;
  }
`;

const SearchInput = styled(Input)`
  margin: 16px;
  margin-bottom: 0;
`;

const WindowsContainer = styled(Segment.Group)`
  &&& {
    margin-top: 0;
    border: none;

    > * {
      border-radius: 0 !important;
    }
  }
`;

type WindowState = Map<number, WindowTaskState>;

const persistNewWindowState = (state: WindowState) => {
  localStorage.setItem("tabontask-active-tabs", JSON.stringify(state.toJS()));
};

const addNewTask = (name: string, state: WindowState) => {
  chrome.windows.create(window => {
    if (window != null) {
      persistNewWindowState(state.set(window.id, { taskName: name }));
    }
  });
};

interface Props {
  initialWindowsState: WindowState;
}

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

  const [query, setQuery] = React.useState();

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (query.startsWith("+")) {
        addNewTask(query.slice(1).trim(), windowState);
      }
    }
  };

  return (
    <PopupContainer>
      <SearchInput
        icon="search"
        placeholder="Search tasks..."
        autoFocus
        value={query}
        onKeyDown={onKeyDown}
        onChange={(e: any) => setQuery(e.target.value)}
      />
      <PaddedMenu pointing secondary>
        <Menu.Item active={true} name="Active" />
        <Menu.Item name="Saved" />
        <Menu.Item name="All" />
      </PaddedMenu>
      <WindowsContainer>
        {windows &&
          windows.map(window => {
            return (
              <WindowTask
                key={window.id}
                current={currentWindow === window.id}
                state={windowState.get(window.id) || { taskName: "" }}
                onChangeState={state =>
                  setWindowState(windowState.set(window.id, state))
                }
                window={window}
              />
            );
          })}
      </WindowsContainer>
    </PopupContainer>
  );
};

chrome.windows.getAll(windows => {
  const initialWindows = Map<string, WindowTaskState>(
    JSON.parse(localStorage.getItem("tabontask-active-tabs") || "{}")
  )
    .mapKeys(key => Number(key))
    .filter((value, key) => windows.some(window => window.id === key));

  render(
    <Popup initialWindowsState={initialWindows} />,
    document.getElementById("app")
  );
});
