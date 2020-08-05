import { removeEmptyInlineTokens } from "../src/lib/remove-empty-inline-tokens";
import * as Tokens from "../src/lib/tokens";

describe("removeEmptyInlineTokens", () => {
  test.each([
    [Tokens.StrongStarStart, Tokens.StrongStarEnd],
    [Tokens.StrongUnderscoreStart, Tokens.StrongUnderscoreEnd],
    [Tokens.InlineLinkStart, Tokens.InlineLinkEnd("https://vogue.com")],
    [Tokens.EmphasisStarStart, Tokens.EmphasisStarEnd],
    [Tokens.EmphasisUnderscoreStart, Tokens.EmphasisUnderscoreEnd]
  ])("$1", (start, end) => {
    let stream = ["Hello, ", start, end, "world."];

    expect(removeEmptyInlineTokens(stream)).toEqual(["Hello, ", "world."]);
  });
});
