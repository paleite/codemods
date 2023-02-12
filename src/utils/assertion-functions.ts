function assertNoUndefinedInArray<T>(
  values: (T | undefined)[]
): asserts values is T[] {
  const containsUndefinedValues = values.some((value) => value === undefined);

  if (!containsUndefinedValues) {
    return;
  }

  throw Error("Array contains undefined values");
}

const isArrayDefined = <T>(array: (T | undefined)[]): array is T[] => {
  try {
    assertNoUndefinedInArray(array);
  } catch (err) {
    // Skip enums that have non-literal values
    return false;
  }

  return true;
};

export { isArrayDefined };
