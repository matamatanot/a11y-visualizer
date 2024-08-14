import React from "react";
import { SettingsContext } from "../components/SettingsProvider";
import { isInAriaHidden } from "../dom";
import { isHidden } from "../../dom/isHidden";
import { getKnownRole } from "../../dom/getKnownRole";

const LIVEREGION_SELECTOR =
  "output, [role~='status'], [role~='alert'], [role~='log'], [aria-live]:not([aria-live='off'])";

export type LiveLevel = "polite" | "assertive";

const closestNodeOfSelector = (node: Node, selector: string): Node | null => {
  const parent = node.parentNode;
  if (!parent) {
    return null;
  }
  if (parent.nodeType === 1 && (parent as Element).matches(selector)) {
    return parent;
  }
  return closestNodeOfSelector(node.parentNode, selector);
};

const getLiveRegions = (el: Element): Element[] => {
  const liveRegions = [...el.querySelectorAll<Element>(LIVEREGION_SELECTOR)];
  const liveRegionsInIframes: Element[] = [
    ...el.querySelectorAll<HTMLIFrameElement>("iframe"),
  ]
    .map((iframe): Element[] | null => {
      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) return null;
      try {
        const d = iframeWindow.document;
        const { readyState } = d;
        if (readyState === "complete") {
          return getLiveRegions(d.body);
        }
      } catch {
        /* noop */
      }
      return null;
    })
    .filter((e): e is Element[] => e !== null)
    .reduce((acc, cur) => {
      return [...acc, ...cur];
    }, []);
  return [...liveRegions, ...liveRegionsInIframes];
};

export const useLiveRegion = ({
  parentRef,
  announceMode,
}: {
  parentRef: React.RefObject<Element>;
  announceMode: "self" | "parent";
}) => {
  const {
    showLiveRegions,
    announcementMaxSeconds,
    announcementSecondsPerCharacter,
  } = React.useContext(SettingsContext);
  const liveRegionsRef = React.useRef<Element[]>([]);
  const liveRegionObserverRef = React.useRef<MutationObserver | null>(null);
  const [announcements, setAnnouncements] = React.useState<
    { content: string; level: LiveLevel; until: number }[]
  >([]);
  const [pausedAnnouncements, setPausedAnnouncements] = React.useState<
    { content: string; level: LiveLevel; rest: number }[]
  >([]);
  const timeoutIdsRef = React.useRef<number[]>([]);

  const connectLiveRegion = React.useCallback(
    (observer: MutationObserver, el: Element) => {
      observer.observe(el, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    },
    [],
  );

  const observeLiveRegion = React.useCallback(
    (el: Element) => {
      if (!liveRegionObserverRef.current) {
        return;
      }
      const liveRegions = getLiveRegions(el);
      [...liveRegions].forEach((el) => {
        if (
          liveRegionObserverRef.current &&
          !liveRegionsRef.current.includes(el)
        ) {
          connectLiveRegion(liveRegionObserverRef.current, el);
        }
      });
      liveRegionsRef.current = Array.from(liveRegions);
    },
    [connectLiveRegion],
  );

  const showAnnouncement = React.useCallback(
    (content: string, level: LiveLevel, msec: number) => {
      const until = new Date().getTime() + msec;
      const announcement = { content, level, until };
      const timeoutId = window.setTimeout(() => {
        setAnnouncements((prev) => {
          const idx = prev.indexOf(announcement);
          return idx === -1
            ? prev
            : [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
        timeoutIdsRef.current = timeoutIdsRef.current.filter(
          (id) => id !== timeoutId,
        );
      }, msec);
      timeoutIdsRef.current.push(timeoutId);
      setAnnouncements((prev) => [...prev, announcement]);
    },
    [],
  );

  const addAnnouncement = React.useCallback(
    (content: string, level: LiveLevel) => {
      const msec = Math.min(
        content.length * announcementSecondsPerCharacter * 1000,
        announcementMaxSeconds * 1000,
      );
      showAnnouncement(content, level, msec);
    },
    [announcementMaxSeconds, announcementSecondsPerCharacter, showAnnouncement],
  );

  const pauseAnnouncements = React.useCallback(() => {
    const stoppedAt = new Date().getTime();
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
    setPausedAnnouncements(
      announcements
        .map((a) => ({
          content: a.content,
          level: a.level,
          rest: a.until - stoppedAt,
        }))
        .filter((a) => a.rest > 0),
    );
    setAnnouncements([]);
  }, [announcements]);

  const resumeAnnouncements = React.useCallback(() => {
    pausedAnnouncements.forEach((a) =>
      showAnnouncement(a.content, a.level, a.rest),
    );
    setPausedAnnouncements([]);
  }, [showAnnouncement, pausedAnnouncements]);

  const pauseOrResumeAnnouncements = React.useCallback(() => {
    if (announcements.length > 0) {
      pauseAnnouncements();
    } else {
      resumeAnnouncements();
    }
  }, [announcements, pauseAnnouncements, resumeAnnouncements]);

  const clearAnnouncements = React.useCallback(() => {
    if (timeoutIdsRef.current.length > 0) {
      timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutIdsRef.current = [];
    }
    setAnnouncements((prev) => (prev.length > 0 ? [] : prev));
    setPausedAnnouncements((prev) => (prev.length > 0 ? [] : prev));
  }, []);

  React.useEffect(() => {
    if (!showLiveRegions || announceMode === "parent") {
      if (liveRegionObserverRef.current) {
        liveRegionObserverRef.current.disconnect();
      }
      return;
    }
    const observer = new MutationObserver((records) => {
      const updates: { content: string; level: LiveLevel }[] = records
        .map((r) => {
          const node =
            closestNodeOfSelector(r.target, LIVEREGION_SELECTOR) || r.target;

          if (isHidden(node as Element) || isInAriaHidden(node as Element)) {
            return null;
          }
          const isAssertive =
            node.nodeType === Node.ELEMENT_NODE &&
            ((node as Element).getAttribute("aria-live") === "assertive" ||
              getKnownRole(node as Element) === "alert");
          const level = isAssertive ? "assertive" : "polite";
          const isAtomic =
            (node as Element).getAttribute?.("aria-atomic") === "true";
          const relevant = (
            (node as Element).getAttribute?.("aria-relevant") ||
            "additions text"
          ).split(/\s/);
          const removals =
            relevant.includes("removals") || relevant.includes("all");
          const additions =
            relevant.includes("additions") || relevant.includes("all");
          if (isAtomic) {
            return { content: node.textContent || "", level };
          }

          const content = [
            (r.removedNodes.length === 0 &&
              r.addedNodes.length === 0 &&
              node.textContent) ||
              "",
            ...[...(removals ? r.removedNodes : [])].map(
              (n) => n.textContent || "",
            ),
            ...[...(additions ? r.addedNodes : [])].map(
              (n) => n.textContent || "",
            ),
          ]
            .filter(Boolean)
            .join(" ");
          return { content, level };
        })
        .filter((e): e is { content: string; level: LiveLevel } => e !== null);

      if (updates.length > 0 && pausedAnnouncements.length > 0) {
        setPausedAnnouncements([]);
      }
      if (updates.some((u) => u.level === "assertive")) {
        clearAnnouncements();
      }
      updates.forEach((c) => {
        announceMode === "self" && addAnnouncement(c.content, c.level);
      });
    });
    liveRegionsRef.current.forEach((el) => connectLiveRegion(observer, el));
    liveRegionObserverRef.current = observer;
    return () => {
      observer.disconnect();
      liveRegionObserverRef.current = null;
    };
  }, [
    announceMode,
    showLiveRegions,
    announcementMaxSeconds,
    announcementSecondsPerCharacter,
    connectLiveRegion,
    addAnnouncement,
    clearAnnouncements,
    pausedAnnouncements,
  ]);

  React.useEffect(() => {
    if (
      announceMode === "parent" ||
      (announceMode === "self" &&
        announcements.length === 0 &&
        pausedAnnouncements.length === 0)
    ) {
      return;
    }
    const w = parentRef.current?.ownerDocument?.defaultView;
    const iframes = parentRef.current?.querySelectorAll("iframe");
    const windows = [
      w,
      ...(iframes ? [...iframes] : []).map(
        (iframe) => (iframe as HTMLIFrameElement).contentWindow,
      ),
    ];
    const clear = () => {
      announceMode === "self" && clearAnnouncements();
    };
    const pauseOrResume = () => {
      announceMode === "self" && pauseOrResumeAnnouncements();
    };
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        pauseOrResume();
      } else if (e.key === "Control") {
        clear();
      }
    };

    windows.forEach((w) => {
      if (!w) return;
      w.addEventListener("keydown", listener);
      w.addEventListener("focusin", clear);
    });

    return () => {
      windows.forEach((w) => {
        if (!w) return;
        w.removeEventListener("keydown", listener);
        w.removeEventListener("focusin", clear);
      });
    };
  }, [
    parentRef,
    showAnnouncement,
    announcements,
    pausedAnnouncements,
    pauseAnnouncements,
    resumeAnnouncements,
    clearAnnouncements,
    announceMode,
    pauseOrResumeAnnouncements,
  ]);

  return {
    observeLiveRegion,
    announcements,
    addAnnouncement,
    pauseAnnouncements,
    resumeAnnouncements,
    clearAnnouncements,
    pauseOrResumeAnnouncements,
  };
};
