import { computeAccessibleName } from "dom-accessibility-api";
import { ElementTip } from "../../types";
import { getClosestByRoles, isAriaHidden } from "../index";

export const ImageSelectors = ["img", "svg", '[role="img"]'] as const;

export const isImage = (el: Element): boolean => {
  const tagName = el.tagName.toLowerCase();
  return (
    tagName === "img" || tagName === "svg" || el.getAttribute("role") === "img"
  );
};

export const imageTips = (el: Element): ElementTip[] => {
  const result: ElementTip[] = [];
  const tagName = el.tagName.toLowerCase();
  const roleAttr = el.getAttribute("role") || "";
  if (isImage(el)) {
    const name = computeAccessibleName(el);
    if (!name && !isAriaHidden(el) && roleAttr !== "presentation") {
      if (tagName === "img") {
        const hasAlt = el.hasAttribute("alt");
        if (hasAlt) {
          result.push({
            type: "warning",
            content: "messages.emptyAltImage",
          });
        } else {
          result.push({ type: "error", content: "messages.noAltImage" });
        }
      } else {
        const ancestorControls = getClosestByRoles(el, [
          "link",
          "button",
          "checkbox",
          "img",
          "menuitemcheckbox",
          "menuitemradio",
          "meter",
          "option",
          "progressbar",
          "radio",
          "scrollbar",
          "separator",
          "slider",
          "switch",
          "tab",
        ]);
        const nameNotRequired = ["scrollbar", "separator", "tab"];
        const ancestorName = ancestorControls
          ? computeAccessibleName(ancestorControls)
          : "";
        if (!ancestorName && !nameNotRequired.includes(roleAttr)) {
          result.push({ type: "error", content: "messages.noName" });
        }
      }
    }
    if (tagName === "svg" && roleAttr === "") {
      result.push({ type: "tagName", content: "svg" });
    }
  }
  return result;
};
