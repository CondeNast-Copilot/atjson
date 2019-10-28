import { InlineAnnotation } from "@atjson/document";

export default class VerticalAdjust extends InlineAnnotation<{
  // Vertical adjust: subscript / superscript
  va: "sub" | "sup";
}> {
  static vendorPrefix = "gdocs";
  static type = "ts_va"; // Text style: vertical adjust
}
