/** Nominal type: a primitive that can only be produced by its own constructor function. */
export type Brand<T, B extends string> = T & { readonly __brand: B };
