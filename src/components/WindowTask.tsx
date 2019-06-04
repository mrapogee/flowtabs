import * as React from "react";
import { WindowFlowState, ChromeWindow } from "../interfaces";
import styled, { css } from "styled-components";
import { WindowLabel } from "./WindowLabel";
import { ResetButton } from "./ResetButton";
import { Icon } from "semantic-ui-react";
import { getDefaultState } from "../hooks/getWindows";
import { oc } from "ts-optchain";
import { SaveMenu } from "./SaveMenu";
import { activateWindow } from "../lib/chromeActions";

interface Props {
  window: ChromeWindow;
  selected?: boolean;
  current: boolean;
  onChangeState: (state: WindowFlowState) => void;
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
}

const selectedBackground = css`
  background-color: rgba(0, 0, 0, 0.02) !important;
`;

const ActionsContainer = styled.div`
  opacity: 0;
  display: flex;
  margin-left: auto;
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

const IconButton = styled(ResetButton)`
  margin-left: 8px;
  color: #5e5e5e;
  font-size: 16px;
`;

const EyeIcon = styled(Icon)`
  align-self: flex-start;
  padding-top: 4px;
  margin-right: 8px !important;
`;

export const WindowTask = ({
  window,
  selected = false,
  current,
  onChangeState,
  onMouseMove,
  onMouseLeave,
  children
}: Props) => {
  const { state = getDefaultState(window), tabs = [] } = window;
  const isSavedWindow = oc(window).state.saved(false);

  return (
    <Container
      selected={selected}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => {
        activateWindow(window);
      }}
    >
      <HeaderContainer>
        {current ? <EyeIcon name="eye" /> : null}
        <WindowLabel
          state={state}
          onChange={name => onChangeState({ ...state, name: name })}
        />

        <ActionsContainer>
          <SaveMenu window={window} state={state} />
          {window.active && (
            <IconButton
              onClick={e => {
                e.stopPropagation();
                chrome.windows.remove(window.id as number);
              }}
            >
              <Icon name="close" />
            </IconButton>
          )}
        </ActionsContainer>
      </HeaderContainer>

      {children}
    </Container>
  );
};
