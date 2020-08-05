import {
  getNumberOfRequiredBackticks,
  linkDestination,
  linkTitle,
} from "./util";

export const HardLineBreak = {
  kind: "HARD_LINE_BREAK",
  value: "\\\n",
} as const;

export const SoftLineBreak = {
  kind: "SOFT_LINE_BREAK",
  value: "\n",
} as const;

export const BlockSeparator = {
  kind: "BLOCK_SEPARATOR",
  value: "\n\n",
} as const;

export function ThematicBreak(token: "*" | "-") {
  return {
    kind: "THEMATIC_BREAK",
    value: token === "*" ? "***\n" : "---\n",
  } as const;
}

export const StrongStarStart = {
  kind: "STRONG_STAR_START",
  value: "**",
} as const;

export const StrongStarEnd = {
  kind: "STRONG_STAR_END",
  value: "**",
} as const;

export const StrongUnderscoreStart = {
  kind: "STRONG_UNDERSCORE_START",
  value: "__",
} as const;

export const StrongUnderscoreEnd = {
  kind: "STRONG_UNDERSCORE_END",
  value: "__",
} as const;

export const EmphasisStarStart = {
  kind: "EM_STAR_START",
  value: "*",
} as const;

export const EmphasisStarEnd = {
  kind: "EM_STAR_END",
  value: "*",
} as const;

export const EmphasisUnderscoreStart = {
  kind: "EM_UNDERSCORE_START",
  value: "_",
} as const;

export const EmphasisUnderscoreEnd = {
  kind: "EM_UNDERSCORE_END",
  value: "_",
} as const;

export const InlineLinkStart = {
  kind: "ANCHOR_TEXT_START",
  value: "[",
} as const;

export const NoBreakSpace = {
  kind: "NO_BREAK_SPACE",
  value: "&nbsp;",
};

export const EmSpace = {
  kind: "EM_SPACE",
  value: "&emsp;",
};

export function InlineLinkEnd(destination: string, title?: string) {
  return {
    kind: "ANCHOR_TEXT_END_HREF",
    value: `](${linkDestination(destination)}${linkTitle(title)})`,
  } as const;
}

export function Image(
  description: string,
  destination: string,
  title?: string
) {
  return {
    kind: "IMAGE",
    value: `![${description}](${linkDestination(destination)}${linkTitle(
      title
    )})`,
  } as const;
}

export function ATXHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  return {
    kind: "ATX_HEADING",
    value: `${Array(level + 1).join("#")} `,
  } as const;
}

export function SetextHeading(level: 1 | 2) {
  return {
    kind: "SETEXT_HEADING",
    value: level === 1 ? "\n====" : "\n----",
  } as const;
}

export const CodeBlock = {
  kind: "CODE_BLOCK",
  value: "    ",
} as const;

export function CodeFenceStart(type: "tildes" | "backticks", info?: string) {
  return {
    kind: "CODE_FENCE_START",
    value: type === "tildes" ? `~~~${info || ""}\n` : `\`\`\`${info || ""}\n`,
  } as const;
}

export function CodeFenceEnd(type: "tildes" | "backticks") {
  return {
    kind: "CODE_FENCE_END",
    value: type === "tildes" ? "~~~" : "```",
  } as const;
}

export function Code(snippet: string) {
  // We need to properly escape backticks inside of code blocks
  // by using variable numbers of backticks.
  let repeat = getNumberOfRequiredBackticks(snippet);
  let backticks = Array(repeat + 1).join("`");
  return {
    kind: "CODE",
    value: snippet.length === 0 ? "" : `${backticks}${snippet}${backticks}`,
  } as const;
}

export function NUMBERED_LIST_DELIM_PERIOD() {
  return {
    kind: "NUMBERED_LIST_DELIM_PERIOD",
    value: ". ",
  } as const;
}

export function NUMBERED_LIST_DELIM_PAREN() {
  return {
    kind: "NUMBERED_LIST_DELIM_PAREN",
    value: ") ",
  } as const;
}

export function BULLETED_LIST_DELIM() {
  return {
    kind: "BULLETED_LIST_DELIM",
    value: "* ",
  } as const;
}

export function INDENT_SPACES(indent: number) {
  return {
    kind: "INDENT_SPACES",
    value: " ".repeat(indent),
  } as const;
}

export const BlockquoteLineStart = {
  kind: "BLOCKQUOTE_LINE_START",
  value: "> ",
} as const;

export const BlockquoteLineEnd = {
  kind: "BLOCKQUOTE_LINE_END",
  value: "\n",
} as const;

export function NumberedListStart(startsAt: number) {
  return {
    kind: "NUMBERED_LIST_START",
    value: "",
    startsAt,
  };
}

export const NumberedListEnd = {
  kind: "NUMBERED_LIST_END",
  value: "\n",
} as const;

export const BulletedListStart = {
  kind: "BULLETED_LIST_START",
  value: "",
} as const;

export const BulletedListEnd = {
  kind: "BULLETED_LIST_END",
  value: "\n",
} as const;

export function ListItemStart(delimiter: string) {
  return {
    kind: "LIST_ITEM_START",
    value: delimiter,
  } as const;
}

export const ListItemEnd = {
  kind: "LIST_ITEM_END",
  value: "\n",
} as const;

export function EscapedPunctuation(punctuation: string) {
  return {
    kind: "ESCAPED_PUNCTUATION",
    value: `\\${punctuation}`,
  } as const;
}

export function HTMLEntity(entityCode: string) {
  return {
    kind: "HTML_ENTITY",
    value: `&${entityCode};`,
  } as const;
}

export type Token =
  | typeof HardLineBreak
  | typeof SoftLineBreak
  | typeof BlockSeparator
  | typeof StrongStarStart
  | typeof StrongStarEnd
  | typeof StrongUnderscoreStart
  | typeof StrongUnderscoreEnd
  | typeof EmphasisStarStart
  | typeof EmphasisStarEnd
  | typeof EmphasisUnderscoreStart
  | typeof EmphasisUnderscoreEnd
  | typeof InlineLinkStart
  | typeof CodeBlock
  | typeof NoBreakSpace
  | typeof EmSpace
  | typeof BlockquoteLineStart
  | typeof BlockquoteLineEnd
  | typeof ListItemEnd
  | typeof NumberedListEnd
  | ReturnType<
      | typeof InlineLinkEnd
      | typeof ThematicBreak
      | typeof NumberedListStart
      | typeof ListItemStart
      | typeof Image
      | typeof ATXHeading
      | typeof SetextHeading
      | typeof CodeFenceStart
      | typeof CodeFenceEnd
      | typeof Code
      | typeof NUMBERED_LIST_DELIM_PERIOD
      | typeof NUMBERED_LIST_DELIM_PAREN
      | typeof BULLETED_LIST_DELIM
      | typeof INDENT_SPACES
      | typeof EscapedPunctuation
      | typeof HTMLEntity
    >;
