import * as React from "react";
import { Label } from "semantic-ui-react";
import styled from "styled-components";

interface Props {
  tab: chrome.tabs.Tab;
}

const TRUNCATE_LENGTH = 23;

const FavImg = styled.img`
  &&& {
    width: 16px !important;
    height: auto !important;
    margin-right: 8px;
  }
`;

const truncate = (length: number, text: string) => {
  if (text.length <= length) {
    return text;
  }

  const truncated = text.slice(0, length - 3);
  const lastSpace = text.lastIndexOf(" ");

  if (lastSpace === -1 || truncated.length - lastSpace > 8) {
    return truncated + "...";
  }

  return truncated.slice(0, lastSpace) + "...";
};

export const TabLabel = ({ tab }: Props) => {
  if (tab.id == null || tab.title == null) {
    return null;
  }

  return (
    <Label
      as="a"
      color="grey"
      style={{ padding: "8px" }}
      onClick={(e: any) => {
        e.stopPropagation();
        chrome.tabs.update(tab.id as number, { selected: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }}
    >
      <FavImg src={tab.favIconUrl} />
      {truncate(TRUNCATE_LENGTH, tab.title)}
    </Label>
  );
};
