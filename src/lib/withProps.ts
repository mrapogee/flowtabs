import * as React from "react";

export const prop = <T>() => {
  return (null as any) as T;
};

const subtract = <T extends {}, S extends {}>(
  target: T & S,
  subtract: S
): T => {
  const out = {} as T;

  for (const key in target) {
    if (target.hasOwnProperty(key) && !subtract.hasOwnProperty(key)) {
      (out as any)[key] = (target as any)[key];
    }
  }

  return out;
};

export const withProps = <P, T>(
  props: P,
  Component: React.ComponentType<T>
): React.ComponentType<T & P> => {
  return (componentProps: T & P) => {
    const newProps = subtract<T, P>(componentProps, props);
    return React.createElement(Component, newProps);
  };
};
