import * as React from "react";
import { WindowTaskState } from "../interfaces";
import styled, { css } from "styled-components";
import { WindowLabel } from "./WindowLabel";
import { set } from "immutable";
import { ResetButton } from "./ResetButton";
import { Icon } from "semantic-ui-react";

interface Props {
  window: chrome.windows.Window;
  state: WindowTaskState;
  selected?: boolean;
  current: boolean;
  onChangeState: (state: WindowTaskState) => void;
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
}

const selectedBackground = css`
  background-color: rgba(0, 0, 0, 0.02) !important;
`;

const ActionsContainer = styled.div`
  opacity: 0;
  margin-left: auto;
  display: flex;
`;

const Container = styled(({ selected, ...rest }: any) => <div {...rest} />)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 16px;
  font-size: 12px;
  color: #3d3d3d;
  padding: 0 !important;
  background-color: #fff;

  &:hover {
    cursor: pointer;
  }

  ${props => props.selected && selectedBackground}
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 16px 8px 16px;

  &&:hover > ${ActionsContainer} {
    opacity: 1;
  }
`;

const CloseButton = styled(ResetButton)`
  color: #5e5e5e;
`;

const FaveButton = styled(({ saved, ...rest }: any) => (
  <ResetButton {...rest} />
))`
  color: ${props => (props.saved ? "" : "#5e5e5e")};
  font-size: 12px;
  margin-right: 4px;
`;

const EyeIcon = styled(Icon)`
  align-self: flex-start;
  padding-top: 4px;
  margin-right: 8px !important;
`;

const toggleSaved = (state: WindowTaskState, tabs: chrome.tabs.Tab[]) => {};

export const WindowTask = ({
  window,
  selected = false,
  current,
  state,
  onChangeState,
  onMouseEnter,
  children
}: Props) => {
  const tabs = window.tabs as chrome.tabs.Tab[];

  return (
    <Container
      selected={selected}
      onMouseEnter={onMouseEnter}
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
        <ActionsContainer>
          <FaveButton
            saved={state.savedTaskId != null}
            onClick={() => toggleSaved(state, tabs)}
          >
            <Icon name="star" />
          </FaveButton>
          <CloseButton
            onClick={e => {
              e.stopPropagation();
              chrome.windows.remove(window.id);
            }}
          >
            <Icon name="close" />
          </CloseButton>
        </ActionsContainer>
      </HeaderContainer>

      {children}
    </Container>
  );
};
