import React from "react";
import { Category, ElementTip } from "../types";
import { SettingsContext } from "./SettingsProvider";
import { Tip } from "./Tip";

type VerticalPosition =
  | "inner-top"
  | "inner-bottom"
  | "outer-top"
  | "outer-bottom";
export const ElementInfo = ({
  x,
  y,
  absoluteX,
  absoluteY,
  width,
  height,
  tips,
  categories,
  rootWidth,
  rootHeight,
}: {
  x: number;
  y: number;
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
  tips: ElementTip[];
  categories: Category[];
  rootWidth: number;
  rootHeight: number;
}) => {
  const { interactiveMode, ...settings } = React.useContext(SettingsContext);
  const [hovered, setHovered] = React.useState(false);
  const selfRef = React.useRef<HTMLDivElement>(null);
  const listenerRef = React.useRef<((e: MouseEvent) => void) | null>(null);
  React.useEffect(() => {
    const w = selfRef.current?.ownerDocument?.defaultView;
    return () => {
      if (listenerRef.current && w) {
        w.removeEventListener("mousemove", listenerRef.current);
      }
    };
  }, []);

  if (!categories.some((category) => settings[category])) {
    return;
  }
  const rightAligned: boolean = width < 160 && x + width > rootWidth - 160;
  const verticalPosition: VerticalPosition = categories.includes("heading")
    ? y < 24
      ? "inner-top"
      : "outer-top"
    : categories.includes("image")
      ? y > 24 && height < 32
        ? "outer-top"
        : "inner-top"
      : y + height > rootHeight - 24
        ? "inner-bottom"
        : "outer-bottom";

  const handleHovered = () => {
    if ((!interactiveMode && hovered) || listenerRef.current) {
      return;
    }
    setHovered(true);
    if (!selfRef.current) {
      return;
    }
    const d = selfRef.current.ownerDocument;
    const w = d.defaultView;
    const listener = (ew: MouseEvent) => {
      const mx = ew.pageX;
      const my = ew.pageY;
      if (
        mx < absoluteX ||
        mx > absoluteX + width ||
        my < absoluteY ||
        my > absoluteY + height
      ) {
        setHovered(false);
        listenerRef.current = null;
      }
    };
    if (w) {
      w.addEventListener("mousemove", listener);
      listenerRef.current = listener;
    }
  };
  return (
    <div
      className="ElementInfo"
      style={{
        top: y,
        left: x,
        width,
        height,
        opacity:
          interactiveMode && hovered ? 1 : settings.tipOpacityPercent / 100,
      }}
      ref={selfRef}
    >
      {interactiveMode && (
        <div
          className="ElementInfo__overlay"
          style={{
            pointerEvents: hovered ? "none" : "auto",
          }}
          onMouseEnter={handleHovered}
          onMouseMove={handleHovered}
        />
      )}
      {tips.length > 0 &&
        categories
          .filter((category) => settings[category])
          .map((category, i) => (
            <div
              key={i}
              className={`ElementInfo__border ElementInfo__border--${category}`}
            />
          ))}
      <div
        className={[
          "ElementInfo__tips",
          `ElementInfo__tips--${verticalPosition}`,
          rightAligned
            ? "ElementInfo__tips--right-aligned"
            : "ElementInfo__tips--left-aligned",
        ].join(" ")}
      >
        {tips.map((tip, i) => (
          <Tip key={i} tip={tip} />
        ))}
      </div>
    </div>
  );
};
