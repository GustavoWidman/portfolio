/**
 * The shape a translation must satisfy: the same keys as the English object, with strings
 * and function bodies free. A key missing from, or only present in, one language fails
 * type checking.
 */
export type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends string
    ? string
    : { [K in keyof T]: Widen<T[K]> };
