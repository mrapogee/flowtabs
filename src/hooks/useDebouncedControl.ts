import { useState, useMemo, useEffect } from "react";
import * as debounce from "debounce";

export const useDebouncedControl = <V>(
  period: number,
  state: V,
  callback: (value: V) => void
): [V, (value: V) => void] => {
  const [debouncedState, setDebouncedState] = useState(state);

  const onChange = useMemo(() => {
    const debouncedCallback = debounce(callback, period);

    return (value: V) => {
      setDebouncedState(value);
      debouncedCallback(value);
    };
  }, [callback, period]);

  useEffect(() => {
    if (debouncedState !== state) {
      setDebouncedState(state);
    }
  }, [state]);

  return [debouncedState, onChange];
};
