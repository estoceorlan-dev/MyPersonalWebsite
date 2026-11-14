import { useEffect, useState } from "react";

export function navigateTo(path: string) {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export function getCurrentRoute(): "portfolio" | "owner-login" | "owner-dashboard" {
  if (typeof window === "undefined") return "portfolio";
  const pathname = window.location.pathname;
  const hash = window.location.hash;

  if (pathname === "/owner/login" || hash === "#/owner/login") {
    return "owner-login";
  }
  if (
    pathname === "/owner" ||
    pathname.startsWith("/owner/") ||
    hash === "#/owner"
  ) {
    return "owner-dashboard";
  }
  return "portfolio";
}

export function useRoute() {
  const [route, setRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const sync = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  return route;
}
