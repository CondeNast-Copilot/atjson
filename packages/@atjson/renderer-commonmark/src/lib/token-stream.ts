export type TokenValue = { kind: string; value: string };
export type TokenFactory = (...args: any[]) => TokenValue;
export type TokenDefinition = TokenValue | TokenFactory;

export function is<T extends TokenFactory>(
  item: TokenValue | string | undefined,
  factory: T
): item is ReturnType<T>;
export function is<T extends TokenValue>(
  item: TokenValue | string | undefined,
  token: T
): item is T;
export function is<T extends TokenDefinition>(
  item: TokenValue | string | undefined,
  tokenOrFactory: T
): item is T extends TokenValue
  ? T
  : T extends TokenFactory
  ? ReturnType<T>
  : never {
  if (item === tokenOrFactory) {
    return true;
  } else if (
    item == null ||
    typeof item === "string" ||
    typeof tokenOrFactory === "object"
  ) {
    return false;
  } else {
    let result = (tokenOrFactory as TokenFactory)();
    return item.kind === result.kind;
  }
}
