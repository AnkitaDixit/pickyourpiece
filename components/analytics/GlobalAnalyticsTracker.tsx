"use client";

import { useEffect } from "react";
import { trackDataClick } from "@/lib/analytics";

export default function GlobalAnalyticsTracker() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const trackedElement = target.closest<HTMLElement>("[data-analytics-event]");
      if (!trackedElement) return;

      trackDataClick(trackedElement);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}