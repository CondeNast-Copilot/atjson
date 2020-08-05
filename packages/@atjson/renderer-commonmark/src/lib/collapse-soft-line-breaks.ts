import * as Tokens from "./tokens";
import { is } from "./token-stream";

type TokenStream = Array<Tokens.Token | string>;

/**
 * This stream operation will remove any redundant soft line
 * breaks from a stream, removing newlines that may introduce
 * non-intentional markdown into the document.
 */
export function collapseSoftLineBreaks(stream: TokenStream) {
  let collapsedStream: TokenStream = [];
  let index = 0;
  let length = stream.length;

  while (index < length) {
    let current = stream[index];

    if (
      is(current, Tokens.BlockSeparator) ||
      is(current, Tokens.SoftLineBreak)
    ) {
      let j = 1;
      let next = stream[index + j];
      let whitespaceToken: Tokens.Token = Tokens.SoftLineBreak;

      // Seek forward until the next token isn't a block separator or soft line break
      while (
        is(next, Tokens.BlockSeparator) ||
        is(next, Tokens.SoftLineBreak)
      ) {
        if (next === Tokens.BlockSeparator) {
          whitespaceToken = Tokens.BlockSeparator;
        }
        j++;
        next = stream[index + j];
      }
      collapsedStream.push(whitespaceToken);
      index += j;
    } else {
      collapsedStream.push(current);
      index++;
    }
  }
  return collapsedStream;
}
