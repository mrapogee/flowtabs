export const findMap = <I, O>(
  list: I[],
  mapper: (value: I, index: number) => O | undefined
): O | undefined => {
  for (let i = 0; i < list.length; i++) {
    const value = list[i];
    const mapped = mapper(value, i);
    if (mapped !== undefined) {
      return mapped;
    }
  }

  return undefined;
};
