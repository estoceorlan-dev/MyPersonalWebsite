import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  personal as defaultPersonal,
  defaultSectionHeadings,
} from "../data/personal";
import type { PersonalData, SectionHeadings } from "../data/personal";
import { skillGroups as defaultSkillGroups } from "../data/skills";
import type { SkillGroup } from "../data/skills";
import {
  rawProjects as defaultRawProjects,
  attachProjectAssets,
} from "../data/projects";
import type { Project } from "../data/projects";
import {
  education as defaultEducation,
  experience as defaultExperience,
} from "../data/experience";
import type { TimelineEntry } from "../data/experience";
import {
  certifications as defaultCertifications,
  achievements as defaultAchievements,
} from "../data/certifications";
import type { Certification, Achievement } from "../data/certifications";

export type PortfolioContent = {
  personal: PersonalData;
  sectionHeadings: SectionHeadings;
  skillGroups: SkillGroup[];
  projects: Project[];
  education: TimelineEntry[];
  experience: TimelineEntry[];
  certifications: Certification[];
  achievements: Achievement[];
};

export type PeriodComparison = {
  currentViews: number;
  previousViews: number;
  viewsChangePct: number;
  currentUnique: number;
  previousUnique: number;
  uniqueChangePct: number;
};

export type TimeSeriesPoint = {
  label: string;
  key: string;
  views: number;
  uniqueVisitors: number;
  previousViews?: number;
  previousUniqueVisitors?: number;
};

export type SingleDayAnalytics = {
  date: string;
  views: number;
  uniqueVisitors: number;
  previousDate: string;
  previousViews: number;
  previousUniqueVisitors: number;
  viewsChangePct: number;
  uniqueChangePct: number;
  hourly: {
    hour: string;
    views: number;
    uniqueVisitors: number;
  }[];
};

export type AnalyticsSummary = {
  totalViewsAllTime: number;
  totalUniqueAllTime: number;
  comparisons: {
    daily: PeriodComparison;
    weekly: PeriodComparison;
    monthly: PeriodComparison;
    yearly: PeriodComparison;
  };
  series: {
    daily: TimeSeriesPoint[];
    weekly: TimeSeriesPoint[];
    monthly: TimeSeriesPoint[];
    yearly: TimeSeriesPoint[];
  };
  selectedDay: SingleDayAnalytics;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
};

export const defaultPortfolioContent: PortfolioContent = {
  personal: defaultPersonal,
  sectionHeadings: defaultSectionHeadings,
  skillGroups: defaultSkillGroups,
  projects: attachProjectAssets(defaultRawProjects),
  education: defaultEducation,
  experience: defaultExperience,
  certifications: defaultCertifications,
  achievements: defaultAchievements,
};

declare const __NEON_FUNCTION_API_URL__: string | undefined;

const rawApiBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
const neonFunctionBase =
  typeof __NEON_FUNCTION_API_URL__ === "string"
    ? __NEON_FUNCTION_API_URL__
    : "";

function resolveActiveApiBase(): string {
  if (rawApiBase) return rawApiBase;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "";
    }
  }
  return neonFunctionBase;
}

export function getApiUrl(path: string): string {
  const base = resolveActiveApiBase();
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveMediaUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("/api/")) return getApiUrl(url);
  return url;
}

export function mergePortfolioContent(
  incoming?: Partial<PortfolioContent> | null,
): PortfolioContent {
  if (!incoming || typeof incoming !== "object") {
    return defaultPortfolioContent;
  }

  const mergedPersonal: PersonalData = {
    ...defaultPersonal,
    ...(incoming.personal || {}),
    socials: {
      ...defaultPersonal.socials,
      ...(incoming.personal?.socials || {}),
    },
    about: Array.isArray(incoming.personal?.about)
      ? incoming.personal.about
      : defaultPersonal.about,
    interests:
      Array.isArray(incoming.personal?.interests) &&
      incoming.personal.interests.length > 0
        ? incoming.personal.interests
        : defaultPersonal.interests,
    languages: Array.isArray(incoming.personal?.languages)
      ? incoming.personal.languages
      : defaultPersonal.languages,
  };

  const mergedHeadings: SectionHeadings = {
    about: {
      ...defaultSectionHeadings.about,
      ...(incoming.sectionHeadings?.about || {}),
    },
    skills: {
      ...defaultSectionHeadings.skills,
      ...(incoming.sectionHeadings?.skills || {}),
    },
    projects: {
      ...defaultSectionHeadings.projects,
      ...(incoming.sectionHeadings?.projects || {}),
    },
    experience: {
      ...defaultSectionHeadings.experience,
      ...(incoming.sectionHeadings?.experience || {}),
    },
    certifications: {
      ...defaultSectionHeadings.certifications,
      ...(incoming.sectionHeadings?.certifications || {}),
    },
  };

  const rawIncomingProjects = Array.isArray(incoming.projects)
    ? incoming.projects
    : defaultRawProjects;

  return {
    personal: mergedPersonal,
    sectionHeadings: mergedHeadings,
    skillGroups: Array.isArray(incoming.skillGroups)
      ? incoming.skillGroups
      : defaultSkillGroups,
    projects: attachProjectAssets(rawIncomingProjects),
    education: Array.isArray(incoming.education)
      ? incoming.education
      : defaultEducation,
    experience: Array.isArray(incoming.experience)
      ? incoming.experience
      : defaultExperience,
    certifications: Array.isArray(incoming.certifications)
      ? incoming.certifications
      : defaultCertifications,
    achievements: Array.isArray(incoming.achievements)
      ? incoming.achievements
      : defaultAchievements,
  };
}

const STORAGE_KEY = "portfolio-content-cache-v1";
const VISIT_SESSION_KEY = "portfolio-visit-tracked-v1";

type PortfolioContextValue = {
  content: PortfolioContent;
  loading: boolean;
  storageMode: "neon" | "memory" | "static";
  refreshPortfolio: () => Promise<void>;
  savePortfolio: (
    next: PortfolioContent,
    token: string,
  ) => Promise<PortfolioContent>;
  resetPortfolio: (token: string) => Promise<PortfolioContent>;
  uploadMedia: (
    file: File,
    token: string,
  ) => Promise<{ id: string; url: string; filename: string; mimeType: string }>;
  fetchAnalytics: (
    token: string,
    selectedDate?: string,
  ) => Promise<AnalyticsSummary>;
};

const PortfolioContext = createContext<PortfolioContextValue>({
  content: defaultPortfolioContent,
  loading: false,
  storageMode: "static",
  refreshPortfolio: async () => {},
  savePortfolio: async (next) => next,
  resetPortfolio: async () => defaultPortfolioContent,
  uploadMedia: async () => ({ id: "", url: "", filename: "", mimeType: "" }),
  fetchAnalytics: async () => {
    throw new Error("Analytics unavailable");
  },
});

function detectDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PortfolioContent>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return mergePortfolioContent(JSON.parse(cached));
      }
    } catch {
      // Ignore storage access errors
    }
    return defaultPortfolioContent;
  });
  const [loading, setLoading] = useState(false);
  const [storageMode, setStorageMode] = useState<"neon" | "memory" | "static">(
    "static",
  );

  const applyContent = useCallback((raw: Partial<PortfolioContent>) => {
    const merged = mergePortfolioContent(raw);
    setContent(merged);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      // Ignore storage errors
    }
    return merged;
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = `${content.personal.name} - Software Developer`;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta && content.personal.seoDescription) {
      descMeta.setAttribute("content", content.personal.seoDescription);
    }
  }, [content.personal.name, content.personal.seoDescription]);

  const refreshPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      let shouldTrackVisit = false;
      const isOwnerRoute =
        typeof window !== "undefined" &&
        (window.location.pathname.startsWith("/owner") ||
          window.location.hash.startsWith("#/owner"));

      if (!isOwnerRoute && typeof window !== "undefined") {
        try {
          if (!sessionStorage.getItem(VISIT_SESSION_KEY)) {
            shouldTrackVisit = true;
          }
        } catch {
          shouldTrackVisit = true;
        }
      }

      const params = new URLSearchParams();
      if (shouldTrackVisit && typeof window !== "undefined") {
        params.set("visit", "1");
        params.set("path", window.location.pathname || "/");
        params.set("device", detectDeviceType());
      }
      const query = params.toString();
      const response = await fetch(
        getApiUrl(`/api/portfolio${query ? `?${query}` : ""}`),
        {
          headers: { Accept: "application/json" },
        },
      );
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("application/json")) {
        const payload = await response.json();
        if (payload && payload.content) {
          applyContent(payload.content);
        }
        if (payload?.storageMode === "neon" || payload?.storageMode === "memory") {
          setStorageMode(payload.storageMode);
        }
        if (shouldTrackVisit) {
          try {
            sessionStorage.setItem(VISIT_SESSION_KEY, "1");
          } catch {
            // Ignore storage errors
          }
        }
      }
    } catch {
      // Offline or static-only mode; keep fallback content
    } finally {
      setLoading(false);
    }
  }, [applyContent]);

  useEffect(() => {
    void refreshPortfolio();
  }, [refreshPortfolio]);

  const savePortfolio = useCallback(
    async (next: PortfolioContent, token: string) => {
      const response = await fetch(getApiUrl("/api/portfolio"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: next }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save portfolio changes.");
      }
      const payload = await response.json();
      if (payload?.storageMode) setStorageMode(payload.storageMode);
      return applyContent(payload.content || next);
    },
    [applyContent],
  );

  const resetPortfolio = useCallback(
    async (token: string) => {
      const response = await fetch(getApiUrl("/api/portfolio/reset"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to reset portfolio content.");
      }
      const payload = await response.json();
      return applyContent(payload.content || defaultPortfolioContent);
    },
    [applyContent],
  );

  const uploadMedia = useCallback(async (file: File, token: string) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const commaIndex = result.indexOf(",");
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });

    const response = await fetch(getApiUrl("/api/media"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        dataBase64: base64,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload file.");
    }
    return response.json();
  }, []);

  const fetchAnalytics = useCallback(
    async (token: string, selectedDate?: string): Promise<AnalyticsSummary> => {
      const query = selectedDate
        ? `?date=${encodeURIComponent(selectedDate)}`
        : "";
      const response = await fetch(
        getApiUrl(`/api/analytics/summary${query}`),
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load visitor analytics.");
      }
      return response.json();
    },
    [],
  );

  const value = useMemo(
    () => ({
      content,
      loading,
      storageMode,
      refreshPortfolio,
      savePortfolio,
      resetPortfolio,
      uploadMedia,
      fetchAnalytics,
    }),
    [
      content,
      loading,
      storageMode,
      refreshPortfolio,
      savePortfolio,
      resetPortfolio,
      uploadMedia,
      fetchAnalytics,
    ],
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}
