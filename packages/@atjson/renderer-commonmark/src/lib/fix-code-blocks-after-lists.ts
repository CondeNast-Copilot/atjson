import * as T from "./tokens";
import { is } from "./token-stream";

type TokenStream = Array<T.Token | string>;

/**
 * Code blocks using spaces can follow lists,
 * however, they will be included in the list
 * if we don't adjust spacing on the list item
 * to force the code block outside of the list
 * See http://spec.commonmark.org/dingus/?text=%20-%20%20%20hello%0A%0A%20%20%20%20I%27m%20a%20code%20block%20_outside_%20the%20list%0A
 */
export function fixCodeBlocksAfterLists(stream: TokenStream) {
  let result: TokenStream = [];

  for (let i = stream.length - 1; i >= 0; i--) {
    let current = stream[i];

    if (is(current, T.CodeBlock)) {
    } else {
      result.unshift(current);
    }
  }
  return result;
}
