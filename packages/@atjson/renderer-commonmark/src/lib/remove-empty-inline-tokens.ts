import * as T from "./tokens";

type TokenStream = Array<T.Token | string>;

export function removeEmptyInlineTokens(stream: TokenStream) {
  let compactedStream: TokenStream = [];
  let index = 0;
  let length = stream.length;
  while (index < length) {
    let current = stream[index];
    let next = stream[index + 1];
    let spaces: TokenStream = [];
    let j = 1;
    while (next === T.NoBreakSpace || next === T.EmSpace) {
      j++;
      spaces.push(next);
      next = stream[index + j];
    }

    if (
      (current === T.StrongStarStart && next === T.StrongStarEnd) ||
      (current === T.StrongUnderscoreStart && next === T.StrongUnderscoreEnd) ||
      (current === T.EmphasisStarStart && next === T.EmphasisStarEnd) ||
      (current === T.EmphasisUnderscoreStart &&
        next === T.EmphasisUnderscoreEnd) ||
      (current === T.BlockquoteLineStart && next === T.BlockquoteLineEnd)
    ) {
      index += j + 1;
      compactedStream.push(...spaces);
    } else {
      compactedStream.push(current);
      index++;
    }
  }
  return compactedStream;
}
