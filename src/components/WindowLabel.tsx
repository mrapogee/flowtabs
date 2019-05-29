import * as React from "react";
import { WindowTaskState } from "../interfaces";
import styled from "styled-components";
import AutosizeInput from "react-input-autosize";

const InputWithClassNameMapped = ({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <AutosizeInput inputClassName={className} {...rest} />
);

const Input = styled(InputWithClassNameMapped)`
  border: none;
  background: none;
  font-size: 16px;
  border-bottom: 2px solid transparent;
  line-height: 24px;
  color: inherit;
  min-width: 150px;

  &:hover,
  &:focus {
    outline: none;
    border-bottom-color: rgba(0, 0, 0, 0.2);
  }
`;

interface Props {
  state: WindowTaskState;
  onChange: (name: string) => void;
}

export const WindowLabel = ({ state, onChange }: Props) => {
  return (
    <div>
      <Input
        placeholder="Unnamed window"
        value={state.taskName}
        onClick={e => {
          e.stopPropagation();
        }}
        onChange={e => {
          onChange(e.target.value);
        }}
      />
    </div>
  );
};
