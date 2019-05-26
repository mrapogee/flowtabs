import * as React from "react";
import { WindowTaskState, ExtensionMessage } from "../interfaces";
import { Label, Segment, Icon } from "semantic-ui-react";
import { TabLabel } from "./TabLabel";
import styled from "styled-components";
import { WindowLabel } from "./WindowLabel";
import { set } from "immutable";
import { ResetButton } from "./ResetButton";
import { useTabs } from "../hooks/useTabs";

interface Props {
  window: chrome.windows.Window;
  state: WindowTaskState;
  current: boolean;
  onChangeState: (state: WindowTaskState) => void;
}

const MAX_TABS = 3;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
`;

const TabContainer = styled.div`
  margin-top: 16px;
  width: 100%;
`;

const Container = styled(Segment)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 16px;
  font-size: 12px;
  color: #3d3d3d;

  &:hover {
    background-color: #f8f8f8 !important;
  }
`;

const IconButton = styled(ResetButton)`
  margin-left: auto;
  color: #5e5e5e;
`;

const EyeIcon = styled(Icon)`
  align-self: flex-start;
  padding-top: 4px;
  padding-right: 8px;
`;

export const WindowTask = ({
  window,
  current,
  state,
  onChangeState
}: Props) => {
  const tabs = useTabs(window);

  return (
    <Container
      onClick={() => {
        chrome.windows.update(window.id, { focused: true });
      }}
    >
      <HeaderContainer>
        {current ? <EyeIcon name="eye" /> : null}
        <WindowLabel
          state={state}
          onChange={name => onChangeState(set(state, "taskName", name))}
        />
        <IconButton
          onClick={e => {
            e.stopPropagation();
            chrome.windows.remove(window.id);
          }}
        >
          <Icon name="close" />
        </IconButton>
      </HeaderContainer>

      <TabContainer>
        {tabs
          .filter(tab => tab.url != null)
          .slice(0, MAX_TABS)
          .map(tab => (
            <TabLabel key={tab.id} tab={tab} />
          ))}
        {tabs.length > MAX_TABS ? (
          <Label style={{ lineHeight: "16px", padding: "8px" }}>
            + {tabs.length - MAX_TABS} tabs
          </Label>
        ) : null}
      </TabContainer>
    </Container>
  );
};
