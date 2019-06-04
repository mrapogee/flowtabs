import * as React from "react";
import { Label } from "semantic-ui-react";
import styled from "styled-components";
import { __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd } from "react-dnd";
import { TabLabelContent } from "./TabLabelContent";
import { TAB } from "../lib/dragTypes";
const { useDragLayer } = dnd;

const DragLayerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  pointer-events: none;
`;

const TabPreview = styled(Label)`
  position: absolute;
  display: flex !important;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  max-width: 300px;
  white-space: nowrap;
  transform: translate(-8px, -50%);
  font-weight: normal !important;
`;

export const PopupDragLayer = () => {
  const { item, position, isDragging } = useDragLayer(monitor => {
    return {
      isDragging: monitor.isDragging(),
      item: monitor.getItem(),
      position: monitor.getClientOffset()
    };
  });

  return (
    <DragLayerContainer>
      {isDragging && position && item.type === TAB && (
        <TabPreview style={{ top: position.y, left: position.x }}>
          <TabLabelContent tab={item.tab} />
        </TabPreview>
      )}
    </DragLayerContainer>
  );
};
