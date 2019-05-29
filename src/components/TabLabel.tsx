import * as React from "react";
import styled from "styled-components";
import { ResetButton } from "./ResetButton";

interface Props {
  tab: chrome.tabs.Tab;
  selected?: boolean;
  actions?: React.ReactNode;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
}

const FavImg = styled.img`
  &&& {
    width: 16px !important;
    height: auto;
    margin-right: 8px;
  }
`;

const TabText = styled.span`
  flex-grow: 1;
  overflow: hidden;
  padding-right: 8px;
  color: transparent;
  -webkit-background-clip: text;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-image: linear-gradient(
    90deg,
    black 0%,
    black calc(100% - 8px),
    rgba(0, 0, 0, 0) calc(100% - 4px),
    rgba(0, 0, 0, 0) 100%
  );
`;

const LabelWithTruncate = styled(({ selected, ...rest }: any) => (
  <div {...rest} />
))`
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  font-size: 12px;
  padding-left: 8px;
  background: ${props =>
    props.selected ? "rgba(0, 0, 0, 0.05)" : "transparent"};
`;

export const TabLabel = ({
  tab,
  selected = false,
  onMouseEnter,
  onMouseLeave,
  actions
}: Props) => {
  if (tab.id == null || tab.title == null) {
    return null;
  }

  return (
    <LabelWithTruncate
      selected={selected}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e: any) => {
        e.stopPropagation();
        chrome.tabs.update(tab.id as number, { selected: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }}
    >
      {tab.favIconUrl && <FavImg src={tab.favIconUrl} />}
      <TabText>{tab.title}</TabText>
      {selected && actions}
    </LabelWithTruncate>
  );
};
