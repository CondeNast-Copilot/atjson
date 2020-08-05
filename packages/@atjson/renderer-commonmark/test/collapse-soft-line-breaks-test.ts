import { collapseSoftLineBreaks } from "../src/lib/collapse-soft-line-breaks";
import * as Tokens from "../src/lib/tokens";

describe("collapseSoftLineBreaks", () => {
  test("single soft line breaks are kept", () => {
    let stream = ["Hello,", Tokens.SoftLineBreak, "world."];

    expect(collapseSoftLineBreaks(stream)).toEqual(stream);
  });

  test("multiple soft line breaks are collapsed into a single soft line break", () => {
    let stream = [
      "Double,",
      Tokens.SoftLineBreak,
      Tokens.SoftLineBreak,
      "double",
      Tokens.SoftLineBreak,
      "toil and trouble"
    ];

    expect(collapseSoftLineBreaks(stream)).toEqual([
      "Double,",
      Tokens.SoftLineBreak,
      "double",
      Tokens.SoftLineBreak,
      "toil and trouble"
    ]);
  });

  test("soft line breaks adjacent to block containers are removed", () => {
    let stream = [
      "Double, double toil and trouble;",
      Tokens.SoftLineBreak,
      Tokens.SoftLineBreak,
      Tokens.BlockSeparator,
      Tokens.SoftLineBreak,
      "Fire burn and caldron bubble."
    ];

    expect(collapseSoftLineBreaks(stream)).toEqual([
      "Double, double toil and trouble;",
      Tokens.BlockSeparator,
      "Fire burn and caldron bubble."
    ]);
  });

  test("multiple block containers are collapsed", () => {
    let stream = [
      "Double, double toil and trouble;",
      Tokens.SoftLineBreak,
      Tokens.BlockSeparator,
      Tokens.BlockSeparator,
      Tokens.SoftLineBreak,
      "Fire burn and caldron bubble."
    ];

    expect(collapseSoftLineBreaks(stream)).toEqual([
      "Double, double toil and trouble;",
      Tokens.BlockSeparator,
      "Fire burn and caldron bubble."
    ]);
  });
});
