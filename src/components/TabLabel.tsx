import * as React from "react";
import styled from "styled-components";
import { __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd } from "react-dnd";
import {
  ChromeTab,
  RectCorner,
  DragTabItem,
  ChromeWindow,
  BID
} from "../interfaces";
import { TAB } from "../lib/dragTypes";
import { oc } from "ts-optchain";
import { getEmptyImage } from "react-dnd-html5-backend";
import { TabLabelContent } from "./TabLabelContent";
import { activateTab } from "../lib/chromeActions";
const { useDrag, useDrop } = dnd;

interface Props {
  window: ChromeWindow;
  tab: ChromeTab;
  selected?: boolean;
  actions?: React.ReactNode;
  onMouseMove?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
  onHoverTab: (corner: RectCorner, tab: ChromeTab) => void;
  onDropTab: (id: BID) => void;
}

const LabelBase = React.forwardRef(
  ({ isDragging, selected, ...rest }: any, ref) => <div ref={ref} {...rest} />
);

const ActionsContainer = styled.div`
  align-self: stretch;
  opacity: 0;
  display: flex;
`;

const LabelWithTruncate = styled(LabelBase)`
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  font-size: 12px;
  padding-left: 8px;
  opacity: ${props => (props.isDragging ? 0 : 1)};
  background: ${props =>
    props.selected ? "rgba(0, 0, 0, 0.05)" : "transparent"};

  &:hover > ${ActionsContainer} {
    opacity: 1;
  }
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

export const TabLabel = ({
  tab,
  window,
  selected = false,
  onMouseMove,
  onMouseLeave,
  onHoverTab,
  onDropTab,
  actions
}: Props) => {
  if (tab.id == null || tab.title == null) {
    return null;
  }

  const onHoverRef = React.useRef(onHoverTab);
  onHoverRef.current = onHoverTab;
  const onDropRef = React.useRef(onDropTab);
  onDropRef.current = onDropTab;

  const dndRef = React.useRef<HTMLElement>();

  const [{ draggingId }, dropRef] = useDrop<DragTabItem, any, any>({
    accept: TAB,

    hover(item, monitor) {
      const rect = dndRef.current!.getBoundingClientRect();
      const offset = monitor.getClientOffset()!;

      const corner: RectCorner = {
        y: offset.y > rect.top + rect.height / 2 ? "bottom" : "top",
        x: offset.x > rect.left + rect.width / 2 ? "right" : "left"
      };

      onHoverRef.current(corner, item.tab);
    },

    drop(item, monitor) {
      onDropRef.current(item.tab.id);
    },

    collect(monitor) {
      return {
        draggingId: oc(monitor.getItem()).id()
      };
    }
  });

  const [, dragRef, previewRef] = useDrag({
    item: { type: TAB, id: tab.id, tab },

    isDragging(monitor) {
      return monitor.getItem().id === tab.id;
    }
  });

  const isDragging = draggingId === tab.id;

  previewRef(getEmptyImage());
  dropRef(dragRef(dndRef));

  return (
    <LabelWithTruncate
      ref={dndRef}
      isDragging={isDragging}
      selected={selected}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={(e: any) => {
        e.stopPropagation();
        activateTab(window, tab);
        chrome.tabs.update(tab.id as number, { selected: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }}
    >
      <TabLabelContent tab={tab} />
      <ActionsContainer>{actions}</ActionsContainer>
    </LabelWithTruncate>
  );
};
