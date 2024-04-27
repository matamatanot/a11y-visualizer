import { computeAccessibleName } from "dom-accessibility-api";
import { ElementTip } from "../../types";
import { isAriaHidden } from "../isAriaHidden";

export const headingTips = (el: Element): ElementTip[] => {
  const result: ElementTip[] = [];
  const tagName = el.tagName.toLowerCase();
  const hidden = isAriaHidden(el);
  const hasHeadingTag = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName);
  const hasHeadingRole = el.getAttribute("role") === "heading";

  if (hasHeadingTag) {
    result.push({ type: "level", content: `${tagName.slice(1)}` });
  }
  if (hasHeadingRole) {
    const ariaLevel = el.getAttribute("aria-level");
    if (ariaLevel) {
      result.push({ type: "level", content: `${ariaLevel}` });
    } else if (!hidden) {
      result.push({
        type: "error",
        content: "messages.noHeadingLevel",
      });
    }
  }
  if (hasHeadingTag || hasHeadingRole) {
    const name = computeAccessibleName(el);
    if (name) {
      result.push({ type: "name", content: name });
    } else if (!hidden) {
      result.push({ type: "error", content: "messages.noName" });
    }
  }

  return result;
};