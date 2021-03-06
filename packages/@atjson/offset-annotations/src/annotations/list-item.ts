import { BlockAnnotation } from "@atjson/document";

export class ListItem extends BlockAnnotation<{
  /**
   * A named identifier used to quickly jump to this item
   */
  anchorName?: string;
}> {
  static vendorPrefix = "offset";
  static type = "list-item";
}
