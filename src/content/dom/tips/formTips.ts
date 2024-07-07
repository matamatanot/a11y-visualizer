import { computeAccessibleName } from "dom-accessibility-api";
import { ElementTip } from "../../types";
import { isAriaHidden, isFocusable, isHidden } from "../index";
import { isInline } from "../isInline";
import { isDefaultSize } from "./isDefaultSize";
import { hasSpacing } from "../hasSpacing";

export const FormSelectors = [
  "input:not([type='hidden']):not([type='button']):not([type='submit']):not([type='reset']):not([type='image'])",
  "textarea",
  "select",
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="radio"]',
  '[role="searchbox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="textbox"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  "label",
  "fieldset",
  "form",
] as const;

const LABELABLE_SELECTOR = [
  "button",
  "input:not([type='hidden'])",
  "meter",
  "output",
  "progress",
  "select",
  "textarea",
].join(",");

const hasInputRole = (el: Element): boolean =>
  [
    "checkbox",
    "combobox",
    "radio",
    "searchbox",
    "slider",
    "spinbutton",
    "switch",
    "textbox",
    "menuitemcheckbox",
    "menuitemradio",
  ].includes(el.getAttribute("role") || "");

const hasInputTag = (el: Element): boolean => {
  const tagName = el.tagName.toLowerCase();
  const typeAttr = el.getAttribute("type");
  return (
    (tagName === "input" &&
      (typeAttr === null ||
        (typeAttr &&
          !["button", "submit", "reset", "image", "hidden"].includes(
            typeAttr,
          )))) ||
    tagName === "textarea" ||
    tagName === "select"
  );
};

export const isLabel = (el: Element): boolean =>
  el.tagName.toLowerCase() === "label";

export const isFieldset = (el: Element): boolean =>
  el.tagName.toLowerCase() === "fieldset";

export const isFormControl = (el: Element): boolean =>
  hasInputRole(el) || hasInputTag(el);

export const formTips = (
  el: Element,
  name: string = computeAccessibleName(el),
): ElementTip[] => {
  const result: ElementTip[] = [];
  const tagName = el.tagName.toLowerCase();
  const typeAttr = el.getAttribute("type");
  const hasTag = hasInputTag(el);
  const hasRole = hasInputRole(el);

  if (hasTag || hasRole) {
    if (!name && !isAriaHidden(el)) {
      result.push({ type: "error", content: "messages.noName" });
    }
    if (!isFocusable(el)) {
      result.push({ type: "error", content: "messages.notFocusable" });
    }

    if (
      el.parentElement &&
      el.parentElement.closest('a, button, [role="button"]')
    ) {
      result.push({ type: "error", content: "messages.nestedInteractive" });
    }

    const rect = el.getBoundingClientRect();
    const checkboxLabel =
      tagName === "input" &&
      (typeAttr === "checkbox" || typeAttr === "radio") &&
      ((el.id && el.ownerDocument.querySelector(`[for="${el.id}"]`)) ||
        el.closest("label"));
    const checkboxLabelRect =
      checkboxLabel && checkboxLabel.getBoundingClientRect();
    if (
      (rect.width < 24 || rect.height < 24) &&
      (!checkboxLabelRect ||
        checkboxLabelRect.width < 24 ||
        checkboxLabelRect.height < 24) &&
      !(isInline(el) || isDefaultSize(el) || hasSpacing(el))
    ) {
      result.push({ type: "warning", content: "messages.smallTargetSize" });
    }
  }
  if (tagName === "input" && typeAttr === "radio") {
    const nameAttr = el.getAttribute("name");
    if (!nameAttr) {
      result.push({ type: "error", content: "messages.noNameAttr" });
    } else {
      const form = el.closest("form");
      const radios = (form || el.ownerDocument).querySelectorAll(
        `input[type="radio"][name="${nameAttr}"]`,
      );
      if (radios.length < 2) {
        result.push({ type: "error", content: "messages.noRadioGroup" });
      }
    }
  }

  if (tagName === "fieldset") {
    result.push({ type: "tagName", content: tagName });
  }

  if (tagName === "label") {
    const forAttr = el.getAttribute("for");
    const forElement = forAttr && el.ownerDocument.getElementById(forAttr);
    const controlByFor =
      forElement && forElement.matches(LABELABLE_SELECTOR) ? forElement : null;
    const controlInside = el.querySelector(LABELABLE_SELECTOR);
    if (
      (!controlByFor && !controlInside) ||
      (controlByFor && isHidden(controlByFor)) ||
      (controlInside && isHidden(controlInside))
    ) {
      result.push({ type: "warning", content: "messages.noControlForLabel" });
    }
  }
  return result;
};
