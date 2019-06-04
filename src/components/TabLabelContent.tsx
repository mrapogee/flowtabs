import * as React from "react";
import styled from "styled-components";
import { ChromeTab } from "../interfaces";

interface Props {
  tab: ChromeTab;
}

const FavImg = styled.img`
  &&& {
    width: 16px !important;
    height: auto !important;
    margin-right: 8px;
  }
`;

const TabText = styled.span`
  flex-grow: 1;
  overflow: hidden;
  padding-right: 8px;
  color: transparent;
  overflow: hidden;
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

const getFavIconUrl = (tab: ChromeTab) => {
  if (tab.favIconUrl) {
    return tab.favIconUrl;
  }

  if (tab.url.startsWith("chrome://")) {
    return "/icons/chrome-32.png";
  }

  return null;
};

export const TabLabelContent = ({ tab }: Props) => {
  const iconUrl = getFavIconUrl(tab);

  return (
    <>
      {iconUrl && <FavImg src={iconUrl} />}
      <TabText>{tab.title}</TabText>
    </>
  );
};
