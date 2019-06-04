import * as React from "react";
import { WindowFlowState } from "../interfaces";
import styled from "styled-components";
import AutosizeInput from "react-input-autosize";
import { useDebouncedControl } from "../hooks/useDebouncedControl";

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
  box-sizing: border-box;

  &:hover,
  &:focus {
    outline: none;
    border-bottom-color: rgba(0, 0, 0, 0.2);
  }
`;

interface Props {
  state: WindowFlowState;
  onChange: (name: string) => void;
}

export const WindowLabel = ({ state, onChange }: Props) => {
  const [name, onChangeName] = useDebouncedControl(300, state.name, onChange);

  return (
    <div>
      <Input
        placeholder="Unnamed window"
        value={name}
        onBlur={e => onChange(e.target.value)}
        onClick={e => {
          e.stopPropagation();
        }}
        onChange={e => {
          onChangeName(e.target.value);
        }}
      />
    </div>
  );
};
