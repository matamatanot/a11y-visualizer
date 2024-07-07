const SizePropertiesWithoutWidth = [
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-block-end-width",
  "border-block-start-width",
  "border-inline-end-width",
  "border-inline-start-width",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "padding-block-end",
  "padding-block-start",
  "padding-inline-end",
  "padding-inline-start",
  "box-sizing",
  "appearance",
  "opacity",
] as const;

const SizeProperties = ["width", ...SizePropertiesWithoutWidth] as const;

type SizeDeclaration = {
  [key in (typeof SizeProperties)[number]]: string;
};

const ElementTypes = [
  "button",
  "input-text",
  "input-range",
  "input-color",
  "input-checkbox",
  "input-radio",
  "input-file",
] as const;
type ElementTypeT = (typeof ElementTypes)[number];
const DefaultStyles: Partial<{ [key in ElementTypeT]: SizeDeclaration }> = {};

const elementType = (el: Element): ElementTypeT | null => {
  const tagName = el.tagName.toLowerCase();
  if (tagName === "button") {
    return "button";
  }
  if (tagName === "input") {
    const type = el.getAttribute("type");
    if (!type) {
      return "input-text";
    }
    switch (type) {
      case "text":
      case "search":
      case "tel":
      case "url":
      case "email":
      case "password":
      case "date":
      case "month":
      case "week":
      case "time":
      case "datetime-local":
      case "number":
        return "input-text";
      case "range":
        return "input-range";
      case "color":
        return "input-color";
      case "checkbox":
        return "input-checkbox";
      case "radio":
        return "input-radio";
      case "file":
        return "input-file";
      case "submit":
      case "reset":
      case "button":
        return "button";
      default:
        return null;
    }
  }
  return null;
};

const getDefaultElement = (elementType: ElementTypeT, d: Document): Element => {
  switch (elementType) {
    case "button": {
      const el = d.createElement("button");
      el.textContent = "hello";
      return el;
    }
    case "input-text": {
      const el = d.createElement("input");
      el.setAttribute("type", "text");
      return el;
    }
    case "input-range": {
      const el = d.createElement("input");
      el.setAttribute("type", "range");
      return el;
    }
    case "input-color": {
      const el = d.createElement("input");
      el.setAttribute("type", "color");
      return el;
    }
    case "input-checkbox": {
      const el = d.createElement("input");
      el.setAttribute("type", "checkbox");
      return el;
    }
    case "input-radio": {
      const el = d.createElement("input");
      el.setAttribute("type", "radio");
      return el;
    }
    case "input-file": {
      const el = d.createElement("input");
      el.setAttribute("type", "file");
      return el;
    }
  }
};

const getDefaultStyle = (el: Element): SizeDeclaration | undefined => {
  const type = elementType(el);
  if (!type) {
    return undefined;
  }
  if (DefaultStyles[type]) {
    return DefaultStyles[type];
  }

  const d = el.ownerDocument;
  const w = d.defaultView;
  if (!w) {
    return undefined;
  }

  const defaultEl = getDefaultElement(type, d);
  d.body.appendChild(defaultEl);
  if ("computedStyleMap" in defaultEl) {
    // Chrome
    const styles = defaultEl.computedStyleMap();
    const decls = Object.fromEntries(
      SizeProperties.map((prop: (typeof SizeProperties)[number]) => [
        prop,
        styles.get(prop)?.toString() || "",
      ]),
    ) as SizeDeclaration;
    DefaultStyles[type] = decls;
  } else {
    const styles = w.getComputedStyle(defaultEl);
    const decls = Object.fromEntries(
      (type === "button" ? SizePropertiesWithoutWidth : SizeProperties).map(
        (prop: (typeof SizeProperties)[number]) => [
          prop,
          styles.getPropertyValue(prop) || "",
        ],
      ),
    ) as SizeDeclaration;
    DefaultStyles[type] = decls;
  }
  d.body.removeChild(defaultEl);
  return DefaultStyles[type];
};

export const isDefaultSize = (el: Element): boolean => {
  const defaultStyle = getDefaultStyle(el);

  if (!defaultStyle) {
    return false;
  }
  if ("computedStyleMap" in el) {
    const elementStyle = el.computedStyleMap();
    return SizeProperties.every(
      (prop) => defaultStyle[prop] === elementStyle.get(prop)?.toString(),
    );
  }
  const type = elementType(el);
  const elementStyle = window.getComputedStyle(el);
  return (
    type === "button" ? SizePropertiesWithoutWidth : SizeProperties
  ).every((prop) => defaultStyle[prop] === elementStyle.getPropertyValue(prop));
};
