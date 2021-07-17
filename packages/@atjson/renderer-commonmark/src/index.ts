import Document, {
  Annotation,
  BlockAnnotation,
  ParseAnnotation,
  UnknownAnnotation,
  is,
} from "@atjson/document";
import {
  Bold,
  Code,
  HTML,
  Heading,
  Image,
  Italic,
  Link,
  List,
  Paragraph,
} from "@atjson/offset-annotations";
import Renderer, { Context } from "@atjson/renderer-hir";
import {
  BEGINNING_WHITESPACE,
  BEGINNING_WHITESPACE_PUNCTUATION,
  ENDING_WHITESPACE,
  ENDING_WHITESPACE_PUNCTUATION,
  LEADING_MD_SPACES,
  TRAILING_MD_SPACES,
  UNMATCHED_TRAILING_ESCAPE_SEQUENCES,
  WHITESPACE_PUNCTUATION,
} from "./lib/punctuation";
export * from "./lib/punctuation";

function getStart(a: { start: number }) {
  return a.start;
}

function getEnd(a: { end: number }) {
  return a.end;
}

function isParseAnnotation(
  annotation: Annotation<any>
): annotation is ParseAnnotation {
  return (
    annotation.vendorPrefix === "atjson" && annotation.type === "parse-token"
  );
}

function isParseOrUnknown(
  annotation: Annotation<any>
): annotation is ParseAnnotation | UnknownAnnotation {
  return (
    annotation.vendorPrefix === "atjson" &&
    (annotation.type === "parse-token" || annotation.type === "unknown")
  );
}

function getPreviousChar(doc: Document, end: number) {
  let start = end;

  function isOverlappingParseAnnotation(a: Annotation<any>) {
    return isParseAnnotation(a) && a.end >= start && a.start < start;
  }

  function isCoveredNonParseAnnotation(a: Annotation<any>) {
    return (
      !isParseOrUnknown(a) &&
      ((a.start >= start && a.start < end) || (a.end >= start && a.end <= end))
    );
  }

  while (start > 0) {
    let parseAnnotations = doc.where(isOverlappingParseAnnotation);
    if (parseAnnotations.length) {
      start = Math.min(...parseAnnotations.annotations.map(getStart));
    } else {
      break;
    }
  }

  for (let a of doc.annotations) {
    if (isCoveredNonParseAnnotation(a)) {
      return "";
    }
  }

  return doc.content[start - 1] || "";
}

function getNextChar(doc: Document, start: number) {
  let end = start;

  function isOverlappingParseAnnotation(a: Annotation<any>) {
    return isParseAnnotation(a) && a.start <= end && a.end > end;
  }

  function isCoveredNonParseAnnotation(a: Annotation<any>) {
    return (
      !isParseOrUnknown(a) &&
      ((a.start >= start && a.start <= end) || (a.end > start && a.end <= end))
    );
  }

  while (end < doc.content.length) {
    let parseAnnotations = doc.where(isOverlappingParseAnnotation);
    if (parseAnnotations.length) {
      end = Math.max(...parseAnnotations.annotations.map(getEnd));
    } else {
      break;
    }
  }

  for (let a of doc.annotations) {
    if (isCoveredNonParseAnnotation(a)) {
      return "";
    }
  }

  return doc.content[end] || "";
}

export function* splitDelimiterRuns(
  annotation: Annotation,
  context: Context,
  options: { escapeHtmlEntities: boolean } = { escapeHtmlEntities: true }
): Generator<void, [string, string, string], string[]> {
  let rawText = yield;
  let text = rawText.map(unescapeEntities).join("");
  let start = 0;
  let end = text.length;
  let match;

  let child = context.children.length === 1 ? context.children[0] : null;
  if (
    child &&
    child.start === annotation.start &&
    child.end === annotation.end &&
    (is(child, Bold) || is(child, Italic))
  ) {
    return ["", text, ""] as [string, string, string];
  }

  while (start < end) {
    match = text.slice(start).match(BEGINNING_WHITESPACE_PUNCTUATION);
    if (!match) break;
    if (match[2]) {
      start += match[2].length;
    } else if (match[3]) {
      let prevChar = getPreviousChar(context.document, annotation.start);
      if (start === 0 && prevChar && !prevChar.match(WHITESPACE_PUNCTUATION)) {
        start += match[3].length;
      } else {
        break;
      }
    }
  }
  while (end > start) {
    match = text.slice(0, end).match(ENDING_WHITESPACE_PUNCTUATION);
    if (!match) break;
    if (match[4]) {
      end -= match[4].length;
    } else if (match[5]) {
      // never include single backslash as last character as this would escape
      // the delimiter
      if (match[5].match(UNMATCHED_TRAILING_ESCAPE_SEQUENCES)) {
        end -= 1;
        break;
      }
      let nextChar = getNextChar(context.document, annotation.end);
      if (
        end === text.length &&
        nextChar &&
        !nextChar.match(WHITESPACE_PUNCTUATION)
      ) {
        end -= match[5].length;
      } else {
        break;
      }
    }
  }

  if (options.escapeHtmlEntities) {
    return [text.slice(0, start), text.slice(start, end), text.slice(end)].map(
      escapeHtmlEntities
    ) as [string, string, string];
  } else {
    return [text.slice(0, start), text.slice(start, end), text.slice(end)].map(
      escapeEntities
    ) as [string, string, string];
  }
}

export function* split(): Generator<void, string[], string[]> {
  let rawText = yield;
  let text = rawText.join("");
  let start = 0;
  let end = text.length;
  let match;

  while (start < end) {
    match = text.slice(start).match(BEGINNING_WHITESPACE);
    if (!match) break;
    start += match[1].length;
  }
  while (end > start) {
    match = text.slice(0, end).match(ENDING_WHITESPACE);
    if (!match) break;
    end -= match[1].length;
  }

  return [text.slice(0, start), text.slice(start, end), text.slice(end)];
}

// http://spec.commonmark.org/0.28/#backslash-escapes
function escapePunctuation(
  text: string,
  options: { escapeHtmlEntities: boolean } = { escapeHtmlEntities: true }
) {
  let escaped = text
    .replace(/([#!*+=\\^_`{|}~])/g, "\\$1")
    .replace(/(\[)([^\]]*$)/g, "\\$1$2") // Escape bare opening brackets [
    .replace(/(^[^[]*)(\].*$)/g, "$1\\$2") // Escape bare closing brackets ]
    .replace(/(\]\()/g, "]\\(") // Escape parenthesis ](
    .replace(/^(\s*\d+)\.(\s+)/gm, "$1\\.$2") // Escape list items; not all numbers
    .replace(/(^[\s]*)-/g, "$1\\-") // `  - list item`
    .replace(/(\r\n|\r|\n)([\s]*)-/g, "$1$2\\-"); // `- list item\n - list item`

  if (options.escapeHtmlEntities) {
    return escapeHtmlEntities(escaped);
  } else {
    return escapeEntities(escaped);
  }
}

function escapeHtmlEntities(text: string) {
  return text
    .replace(/&([^\s]+);/g, "\\&$1;")
    .replace(/</g, "&lt;")
    .replace(/\u00A0/gu, "&nbsp;")
    .replace(/\u2000/gu, "&#8192;")
    .replace(/\u2001/gu, "&#8193;")
    .replace(/\u2002/gu, "&ensp;")
    .replace(/\u2003/gu, "&emsp;")
    .replace(/\u2004/gu, "&#8196;")
    .replace(/\u2005/gu, "&#8197;")
    .replace(/\u2006/gu, "&#8198;")
    .replace(/\u2007/gu, "&#8199;")
    .replace(/\u2008/gu, "&#8200;")
    .replace(/\u2009/gu, "&#8201;")
    .replace(/\u200A/gu, "&#8202;")
    .replace(/\u200B/gu, "&#8203;")
    .replace(/\u202F/gu, "&#8239;")
    .replace(/\u205F/gu, "&#8287;")
    .replace(/\u3000/gu, "&#12288;")
    .replace(/\uFEFF/gu, "&#65279;");
}

function escapeEntities(text: string) {
  return text
    .replace(/&([^\s]+);/g, "\\&$1;")
    .replace(/\u00A0/gu, "&nbsp;")
    .replace(/\u2000/gu, "&#8192;")
    .replace(/\u2001/gu, "&#8193;")
    .replace(/\u2002/gu, "&ensp;")
    .replace(/\u2003/gu, "&emsp;")
    .replace(/\u2004/gu, "&#8196;")
    .replace(/\u2005/gu, "&#8197;")
    .replace(/\u2006/gu, "&#8198;")
    .replace(/\u2007/gu, "&#8199;")
    .replace(/\u2008/gu, "&#8200;")
    .replace(/\u2009/gu, "&#8201;")
    .replace(/\u200A/gu, "&#8202;")
    .replace(/\u200B/gu, "&#8203;")
    .replace(/\u202F/gu, "&#8239;")
    .replace(/\u205F/gu, "&#8287;")
    .replace(/\u3000/gu, "&#12288;")
    .replace(/\uFEFF/gu, "&#65279;");
}

function unescapeEntities(text: string) {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&nbsp;/gi, "\u00A0")
    .replace(/&emsp;/gi, "\u2003")
    .replace(/&#8192;/gi, "\u2000")
    .replace(/&#8193;/gi, "\u2001")
    .replace(/&ensp;/gi, "\u2002")
    .replace(/&#8196;/gi, "\u2004")
    .replace(/&#8197;/gi, "\u2005")
    .replace(/&#8198;/gi, "\u2006")
    .replace(/&#8199;/gi, "\u2007")
    .replace(/&#8200;/gi, "\u2008")
    .replace(/&#8201;/gi, "\u2009")
    .replace(/&#8202;/gi, "\u200A")
    .replace(/&#8203;/gi, "\u200B")
    .replace(/&#8239;/gi, "\u202F")
    .replace(/&#8287;/gi, "\u205F")
    .replace(/&#12288;/gi, "\u3000")
    .replace(/&#65279;/gi, "\uFEFF");
}

function escapeAttribute(text: string) {
  return text.replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function getNumberOfRequiredBackticks(text: string) {
  let index = 0;
  let counts = [0];
  for (let i = 0, len = text.length; i < len; i++) {
    if (text[i] === "`") {
      counts[index] = counts[index] + 1;
    } else if (counts[index] !== 0) {
      counts.push(0);
      index++;
    }
  }

  let total = 1;
  for (let count of counts) {
    if (count === total) {
      total += 1;
    }
  }

  return total;
}

function isHTML(a: { type: string }): a is HTML {
  return a.type === "html";
}

function blockquotify(line: string) {
  return `> ${line}`;
}

function codify(line: string) {
  return `    ${line}`;
}

export default class CommonmarkRenderer extends Renderer {
  /**
   * Controls whether HTML entities should be escaped. This
   * may be desireable if markdown is being generated for humans
   * and your markdown flavor doesn't support HTML.
   *
   * By default, `escapeHtmlEntities` is set to `true` if your
   * schema has an annotation with the type `html`. You can override
   * this configuration by passing in another parameter to the constructor.
   */
  protected options: {
    escapeHtmlEntities: boolean;
  };

  protected state: any;

  constructor(document: Document, options?: { escapeHtmlEntities: boolean }) {
    super(document);
    this.state = {};
    if (options == null) {
      let DocumentClass = document.constructor as typeof Document;
      this.options = {
        escapeHtmlEntities: !!DocumentClass.schema.find(isHTML),
      };
    } else {
      this.options = options;
    }
  }

  text(text: string) {
    if (this.state.isPreformatted) {
      return text;
    }
    return escapePunctuation(text, this.options);
  }

  *root(): Iterator<void, string, string[]> {
    let rawText = yield;
    return rawText.join("");
  }

  /**
   * Bold text looks like **this** in Markdown.
   *
   * Asterisks are used here because they can split
   * words; underscores cannot split words.
   */
  *Bold(bold: Bold, context: Context): Generator<void, string, string[]> {
    let [before, text, after] = yield* splitDelimiterRuns(
      bold,
      context,
      this.options
    );
    if (text.length === 0) {
      return before + after;
    } else {
      // When there is no surrounding whitespace,
      // we will allow for an incorrect nesting of
      // bold / italic to maintain the general intent
      // over correctness.
      let hasInnerMarkup =
        context.children.length === 1 && before === "" && after === "";

      if (
        !context.previous &&
        !context.next &&
        context.parent instanceof Italic &&
        !hasInnerMarkup
      ) {
        return `${before}__${text}__${after}`;
      }
      return `${before}**${text}**${after}`;
    }
  }

  /**
   * > A block quote has `>` in front of every line
   * > it is on.
   * >
   * > It can also span multiple lines.
   */
  *Blockquote(): Generator<void, string, string[]> {
    let text = yield;
    let lines: string[] = text.join("").split("\n");
    let endOfQuote = lines.length;
    let startOfQuote = 0;

    while (startOfQuote < endOfQuote - 1 && lines[startOfQuote].match(/^\s*$/))
      startOfQuote++;
    while (
      endOfQuote > startOfQuote + 1 &&
      lines[endOfQuote - 1].match(/^\s*$/)
    )
      endOfQuote--;

    let quote =
      lines.slice(startOfQuote, endOfQuote).map(blockquotify).join("\n") + "\n";

    if (!this.state.tight) {
      quote += "\n";
    }
    return quote;
  }

  /**
   * # Headings have 6 levels, with a single `#` being the most important
   *
   * ###### and six `#` being the least important
   *
   * If the heading spans multiple lines, then we will use the underline
   * style, using a series of `=` or `-` markers. This only works for
   * headings of level 1 or 2, so any other level will be broken.
   */
  *Heading(heading: Heading): Generator<void, string, string[]> {
    let rawText = yield;
    let text = rawText.join("");
    let level = new Array(heading.attributes.level + 1).join("#");

    // Multiline headings are supported for level 1 and 2
    if (text.indexOf("\n") !== -1) {
      if (heading.attributes.level === 1) {
        return `${text}\n====\n`;
      } else if (heading.attributes.level === 2) {
        return `${text}\n----\n`;
      }
    }
    return `${level} ${text}\n`;
  }

  /**
   * A horizontal rule separates sections of a story
   * ***
   * Into multiple sections.
   */
  *HorizontalRule(): Generator<void, string, string[]> {
    return "***\n";
  }

  /**
   * Images are embedded like links, but with a `!` in front.
   * ![CommonMark](http://commonmark.org/images/markdown-mark.png)
   */
  *Image(image: Image): Generator<void, string, string[]> {
    let description = escapePunctuation(image.attributes.description || "");
    if (image.attributes.title) {
      let title = image.attributes.title.replace(/"/g, '\\"');
      return `![${description}](${image.attributes.url} "${title}")`;
    }
    return `![${description}](${image.attributes.url})`;
  }

  /**
   * Italic text looks like *this* in Markdown.
   */
  *Italic(italic: Italic, context: Context): Generator<void, string, string[]> {
    // This adds support for strong emphasis (per Commonmark)
    // Strong emphasis includes _*two*_ emphasis markers around text.
    let state = Object.assign({}, this.state);
    this.state.isItalicized = true;

    let [before, text, after] = yield* splitDelimiterRuns(
      italic,
      context,
      this.options
    );
    this.state = state;

    if (text.length === 0) {
      return before + after;
    } else {
      let markup = state.isItalicized ? "_" : "*";
      let hasWrappingBoldMarkup =
        !context.previous && !context.next && context.parent instanceof Bold;
      let hasAdjacentBoldMarkup =
        (context.next instanceof Bold && after.length === 0) ||
        (context.previous instanceof Bold && before.length === 0);
      let hasAlignedParent =
        context.parent.start === italic.start &&
        context.parent.end === italic.end;

      if (
        (hasWrappingBoldMarkup && !hasAlignedParent) ||
        hasAdjacentBoldMarkup
      ) {
        markup = "_";
      }
      return `${before}${markup}${text}${markup}${after}`;
    }
  }

  /**
   * A line break in Commonmark can be two white spaces at the end of the line  <--
   * or it can be a backslash at the end of the line\
   */
  *LineBreak(_: any, context: Context): Generator<void, string, string[]> {
    // Line breaks cannot end markdown block elements or paragraphs
    // https://spec.commonmark.org/0.29/#example-641
    if (context.parent instanceof BlockAnnotation && context.next == null) {
      return "";
    }

    // MD code and html blocks cannot contain line breaks
    // https://spec.commonmark.org/0.29/#example-637
    if (context.parent.type === "code" || context.parent.type === "html") {
      return "\n";
    }

    return "\\\n";
  }

  /**
   * A [link](http://commonmark.org) has the url right next to it in Markdown.
   */
  *Link(link: Link): Generator<void, string, string[]> {
    let [before, text, after] = yield* split();
    let url = escapeAttribute(link.attributes.url);
    if (link.attributes.title) {
      let title = link.attributes.title.replace(/"/g, '\\"');
      return `${before}[${text}](${url} "${title}")${after}`;
    }
    return `${before}[${text}](${url})${after}`;
  }

  /**
   * A `code` span can be inline or as a block:
   *
   * ```js
   * function () {}
   * ```
   */
  *Code(code: Code, context: Context): Generator<void, string, string[]> {
    let state = Object.assign({}, this.state);
    Object.assign(this.state, {
      isPreformatted: true,
      htmlSafe: true,
    });

    let rawText = yield;
    let text = rawText.join("");
    this.state = state;

    if (code.attributes.style === "fence") {
      text = "\n" + text;
      let info = code.attributes.info || "";
      let newlines = "\n";
      if (this.state.isList && context.next) {
        newlines += "\n";
      }

      if (text.indexOf("```") !== -1 || info.indexOf("```") !== -1) {
        return `~~~${info}${text}~~~${newlines}`;
      } else {
        return `\`\`\`${info}${text}\`\`\`${newlines}`;
      }
    } else if (code.attributes.style === "block") {
      return text.split("\n").map(codify).join("\n") + "\n";
    } else {
      // MarkdownIt strips all leading and trailing whitespace from code blocks,
      // which means that we get an empty string for a single whitespace (` `).
      if (text.length === 0) {
        return "` `";

        // We need to properly escape backticks inside of code blocks
        // by using variable numbers of backticks.
      } else {
        let backticks = "`".repeat(getNumberOfRequiredBackticks(text));
        return `${backticks}${text}${backticks}`;
      }
    }
  }

  *Html(html: HTML): Generator<void, string, string[]> {
    let state = Object.assign({}, this.state);
    Object.assign(this.state, {
      isPreformatted: true,
      htmlSafe: true,
    });

    let rawText = yield;
    let text = rawText.join("");

    this.state = state;

    if (html.attributes.style === "block") {
      return text + "\n";
    }
    return text;
  }

  /**
   * A list item is part of an ordered list or an unordered list.
   */
  *ListItem(): Generator<void, string, string[]> {
    let digit: number = this.state.digit;
    let delimiter = this.state.delimiter;
    let marker: string = delimiter;
    if (this.state.type === "numbered") {
      marker = `${digit}${delimiter}`;
      this.state.digit++;
    }

    let indent = " ".repeat(marker.length + 1);
    let text = yield;
    let item = text.join("");
    let firstCharacter = 0;
    while (item[firstCharacter] === " ") firstCharacter++;

    let lines: string[] = item.split("\n");
    lines.push((lines.pop() || "").replace(/[ ]+$/, ""));
    lines.unshift((lines.shift() || "").replace(/^[ ]+/, ""));
    let [first, ...rest] = lines;

    item =
      " ".repeat(firstCharacter) +
      first +
      "\n" +
      rest
        .map(function leftPad(line) {
          return indent + line + "\n";
        })
        .join("")
        .replace(/[ ]+$/, "");

    if (this.state.tight) {
      item = item.replace(/([ \n])+$/, "\n");
    }

    // Code blocks using spaces can follow lists,
    // however, they will be included in the list
    // if we don't adjust spacing on the list item
    // to force the code block outside of the list
    // See http://spec.commonmark.org/dingus/?text=%20-%20%20%20hello%0A%0A%20%20%20%20I%27m%20a%20code%20block%20_outside_%20the%20list%0A
    if (this.state.hasCodeBlockFollowing) {
      return ` ${marker}    ${item}`;
    }
    return `${marker} ${item}`;
  }

  /**
   * 1. An ordered list contains
   * 2. A number
   * 3. Of things with numbers preceding them
   */
  *List(list: List, context: Context): Generator<void, string, string[]> {
    let start = 1;

    if (list.attributes.startsAt != null) {
      start = list.attributes.startsAt;
    }

    let delimiter = "";

    if (list.attributes.type === "numbered") {
      delimiter = ".";

      if (
        context.previous instanceof List &&
        context.previous.attributes.type === "numbered" &&
        context.previous.attributes.delimiter === "."
      ) {
        delimiter = ")";
      }
    } else if (list.attributes.type === "bulleted") {
      delimiter = "-";

      if (
        context.previous instanceof List &&
        context.previous.attributes.type === "bulleted" &&
        context.previous.attributes.delimiter === "-"
      ) {
        delimiter = "+";
      }
    }
    list.attributes.delimiter = delimiter;

    let state = Object.assign({}, this.state);

    // Handle indendation for code blocks that immediately follow a list.
    let hasCodeBlockFollowing =
      context.next instanceof Code && context.next.attributes.style === "block";
    Object.assign(this.state, {
      isList: true,
      type: list.attributes.type,
      digit: start,
      delimiter,
      tight: !list.attributes.loose,
      hasCodeBlockFollowing,
    });

    let text = yield;

    this.state = state;
    return text.join("") + "\n";
  }

  /**
   * Paragraphs are delimited by two or more newlines in markdown.
   */
  *Paragraph(
    _paragraph: Paragraph,
    _context: Context
  ): Generator<void, string, string[]> {
    let rawText = yield;
    let text = rawText.join("");

    // If a paragraph has text, remove leading and trailing MD-meaningful
    // space characters which could be interpreted as indented code blocks
    // or line breaks
    if (!text.match(/^\s+$/g)) {
      text = text
        .replace(LEADING_MD_SPACES, "")
        .replace(TRAILING_MD_SPACES, "");
    }

    // Two newlines in raw text need to be encoded as HTML
    text = text.replace(/\n\n/g, "&#10;&#10;");

    if (this.state.tight) {
      return text + "\n";
    }
    return text + "\n\n";
  }

  *FixedIndent(): Generator<void, string, string[]> {
    let rawText = yield;
    return rawText.join("");
  }
}
