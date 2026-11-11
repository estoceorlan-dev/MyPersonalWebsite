import { useEffect, useState } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 767px), (pointer: coarse)";

function matchesMobile(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

/**
 * Tracks whether the current viewport or primary pointer is mobile/touch.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(matchesMobile);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}
