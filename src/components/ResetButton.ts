import styled from "styled-components";

export const ResetButton = styled.button`
  background-color: transparent;
  padding: 0;
  min-width: 0;
  border: none;
  font-size: inherit;
  text-align: inherit;

  &:focus {
    outline: none;
  }

  &:hover {
    cursor: pointer;
  }
`;
