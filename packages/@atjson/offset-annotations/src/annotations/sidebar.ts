import { BlockAnnotation } from "@atjson/document";

/**
 * Sidebar annotations are alignable and may be used to display
 * content within a body that is graphically separate but with
 * contextual connection.
 **/

export class Sidebar extends BlockAnnotation<{
  inset: "left" | "right";
  /**
   * A named identifier used to quickly jump to this item
   */
  anchorName?: string;
}> {
  static type = "sidebar";
  static vendorPrefix = "offset";
}
