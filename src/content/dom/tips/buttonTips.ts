import { computeAccessibleName } from "dom-accessibility-api";
import { ElementTip } from "../../types";
import { isAriaHidden } from "../isAriaHidden";
import { isFocusable } from "../isFocusable";
import { hasInteractiveDescendant } from "../hasInteractiveDescendant";
import { hasTabIndexDescendant } from "../hasTabIndexDescendant";
import { isInline } from "../isInline";
import { isDefaultSize } from "./isDefaultSize";
import { isSmallTarget } from "./isSmallTarget";
import { hasSpacing } from "../hasSpacing";

export const ButtonSelectors = [
  "button",
  "details > summary:first-child",
  '[role="button"]',
  '[role="menuitem"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="image"]',
] as const;

export const isButton = (el: Element): boolean => {
  const tagName = el.tagName.toLowerCase();
  const typeAttr = el.getAttribute("type");
  const hasButtonTag =
    tagName === "button" ||
    (tagName === "summary" && el.matches("details > summary:first-child")) ||
    (tagName === "input" &&
      !!typeAttr &&
      ["button", "submit", "reset", "image"].includes(typeAttr));
  const role = el.getAttribute("role");
  const hasButtonRole = role === "button" || role === "menuitem";
  return hasButtonTag || hasButtonRole;
};

export const buttonTips = (
  el: Element,
  name: string = computeAccessibleName(el),
): ElementTip[] => {
  const result: ElementTip[] = [];
  const tagName = el.tagName.toLowerCase();
  const role = el.getAttribute("role");

  if (isButton(el)) {
    if (!name && !isAriaHidden(el)) {
      result.push({ type: "error", content: "messages.noName" });
    }
    if (!isFocusable(el)) {
      result.push({ type: "error", content: "messages.notFocusable" });
    }
    if (
      (tagName === "button" || role === "button") &&
      (hasInteractiveDescendant(el) || hasTabIndexDescendant(el))
    ) {
      result.push({ type: "error", content: "messages.nestedInteractive" });
    }
    if (
      (tagName === "button" || role === "button") &&
      el.parentElement &&
      el.parentElement.closest('a, button, [role="button"]')
    ) {
      result.push({ type: "error", content: "messages.nestedInteractive" });
    }
    if (
      isSmallTarget(el) &&
      !(isInline(el) || isDefaultSize(el) || hasSpacing(el))
    ) {
      result.push({ type: "warning", content: "messages.smallTargetSize" });
    }
  }
  return result;
};
