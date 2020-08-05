import * as T from "./tokens";
import { is } from "./token-stream";

type TokenStream = Array<T.Token | string>;

export function addDelimitersToLists(stream: TokenStream) {
  let result: TokenStream = [];
  let markers: {
    delimiter: "." | ")" | "*" | "-";
    value?: number;
    indent: number;
  }[] = [];
  let lastMarker:
    | {
        delimiter: "." | ")" | "*" | "-";
        value?: number;
        indent: number;
      }
    | undefined = undefined;

  for (let i = 0, len = stream.length; i < len; i++) {
    let current = stream[i];
    let previous = stream[i - 1];
    let marker = markers[markers.length - 1];

    // Disambiguate between adjacent lists by rotating through
    // delimiters that are available as per the commonmark spec
    if (is(current, T.NumberedListStart)) {
      let indent = marker?.indent || 0;

      // We alternate between markers that start with
      // . and ) (cf. 1. and 1)) for numbered lists
      if (is(previous, T.NumberedListEnd) && lastMarker?.delimiter === ".") {
        markers.push({
          value: current.startsAt,
          delimiter: ")",
          indent,
        });
      } else {
        markers.push({
          value: current.startsAt,
          delimiter: ".",
          indent,
        });
      }
    } else if (is(current, T.NumberedListEnd)) {
      lastMarker = markers.pop();
    }

    if (is(current, T.BulletedListStart)) {
      let indent = marker?.indent || 0;
      // We alternate between markers that start with
      // * and - for bulleted lists
      if (is(previous, T.BulletedListEnd) && lastMarker?.delimiter === "-") {
        debugger;
        markers.push({
          delimiter: "*",
          indent,
        });
      } else {
        markers.push({
          delimiter: "-",
          indent,
        });
      }
    } else if (is(current, T.BulletedListEnd)) {
      lastMarker = markers.pop();
    }

    if (is(current, T.ListItemStart)) {
      let indent = "";
      let outerMarker = markers[markers.length - 2];
      if (outerMarker) {
        indent = " ".repeat(outerMarker.indent);
      }

      if (marker.value != null) {
        let number = `${indent}${marker.value}${marker.delimiter} `;
        result.push(T.ListItemStart(number));
        marker.value++;
        marker.indent = number.length;
      } else {
        let bullet = `${indent}${marker.delimiter} `;
        result.push(T.ListItemStart(bullet));
        marker.indent = bullet.length;
      }
    } else if (is(current, T.ThematicBreak) && is(previous, T.ListItemStart)) {
      // If you want a thematic break in a list item, use a different bullet:
      // https://spec.commonmark.org/0.29/#example-31
      if (marker.delimiter === "*") {
        result.push(T.ThematicBreak("-"));
      } else if (marker.delimiter === "-") {
        result.push(T.ThematicBreak("*"));
      }
    } else if (
      is(current, T.SoftLineBreak) ||
      is(current, T.BlockSeparator) ||
      is(current, T.HardLineBreak) ||
      is(current, T.BlockquoteLineEnd)
    ) {
      result.push(current);
      if (marker) {
        result.push(" ".repeat(marker.indent));
      }
    } else {
      result.push(current);
    }
  }
  return result;
}
