import { useEffect } from "react";

type LockedElement = {
  element: HTMLElement;
  overflow: string;
  overscrollBehavior: string;
};

let lockCount = 0;
let lockedElements: LockedElement[] = [];

export function useModalScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    lockCount += 1;

    if (lockCount === 1) {
      const scrollContainers = [
        document.documentElement,
        document.body,
        ...Array.from(document.querySelectorAll<HTMLElement>("[data-dashboard-scroll-container]")),
      ];

      lockedElements = scrollContainers.map((element) => ({
        element,
        overflow: element.style.overflow,
        overscrollBehavior: element.style.overscrollBehavior,
      }));

      lockedElements.forEach(({ element }) => {
        element.style.overflow = "hidden";
        element.style.overscrollBehavior = "contain";
      });
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        lockedElements.forEach(({ element, overflow, overscrollBehavior }) => {
          element.style.overflow = overflow;
          element.style.overscrollBehavior = overscrollBehavior;
        });
        lockedElements = [];
      }
    };
  }, [enabled]);
}
