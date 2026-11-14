import crypto from "node:crypto";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";
import { parseEnv } from "@neon/env";
import { attachDatabasePool } from "@neon/functions";
import neonConfig from "../neon";
import {
  personal as defaultPersonal,
  defaultSectionHeadings,
} from "../src/data/personal";
import { skillGroups as defaultSkillGroups } from "../src/data/skills";
import { rawProjects as defaultRawProjects } from "../src/data/projects";
import {
  education as defaultEducation,
  experience as defaultExperience,
} from "../src/data/experience";
import {
  certifications as defaultCertifications,
  achievements as defaultAchievements,
} from "../src/data/certifications";

dotenv.config({ path: [".env.local", ".env"] });

const { Pool } = pg;

export type SeededPortfolioContent = {
  personal: typeof defaultPersonal;
  sectionHeadings: typeof defaultSectionHeadings;
  skillGroups: typeof defaultSkillGroups;
  projects: typeof defaultRawProjects;
  education: typeof defaultEducation;
  experience: typeof defaultExperience;
  certifications: typeof defaultCertifications;
  achievements: typeof defaultAchievements;
};

export function getInitialSeedContent(): SeededPortfolioContent {
  return structuredClone({
    personal: defaultPersonal,
    sectionHeadings: defaultSectionHeadings,
    skillGroups: defaultSkillGroups,
    projects: defaultRawProjects,
    education: defaultEducation,
    experience: defaultExperience,
    certifications: defaultCertifications,
    achievements: defaultAchievements,
  });
}

export type OwnerUser = {
  id: number;
  email: string;
  passwordHash: string;
  updatedAt: string;
};

export type MediaAssetRecord = {
  id: string;
  filename: string;
  mimeType: string;
  bytes: Buffer;
  sizeBytes: number;
  createdAt: string;
};

export type VisitRecord = {
  visitDate: string; // YYYY-MM-DD
  visitHour: number; // 0..23
  visitorHash: string;
  path: string;
  deviceType: "desktop" | "mobile" | "tablet";
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

let pool: pg.Pool | null = null;
let initialized = false;
let initPromise: Promise<"neon" | "memory"> | null = null;
let activeMode: "neon" | "memory" = "memory";
let cachedPortfolioContent: {
  data: SeededPortfolioContent;
  fetchedAt: number;
} | null = null;

const PORTFOLIO_CACHE_TTL_MS = 30_000;

// In-memory fallback state when DATABASE_URL is not configured
let memoryOwner: OwnerUser | null = null;
let memoryContent: SeededPortfolioContent = getInitialSeedContent();
const memoryMedia = new Map<string, MediaAssetRecord>();
const memoryVisits: VisitRecord[] = [];

function normalizeNeonUrl(raw: string): string {
  const trimmed = raw.trim();
  if (
    trimmed.includes("sslmode=") &&
    !trimmed.includes("uselibpqcompat=")
  ) {
    return `${trimmed}&uselibpqcompat=true`;
  }
  return trimmed;
}

function resolveNeonPostgresEnv(): {
  databaseUrl: string;
  databaseUrlUnpooled: string;
  branch?: string;
  branchId?: string;
} | null {
  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (!rawDatabaseUrl) return null;

  try {
    if (process.env.DATABASE_URL_UNPOOLED?.trim()) {
      const parsed = parseEnv(neonConfig, [
        "DATABASE_URL",
        "DATABASE_URL_UNPOOLED",
      ]);
      return {
        databaseUrl: normalizeNeonUrl(parsed.postgres.databaseUrl),
        databaseUrlUnpooled: normalizeNeonUrl(
          parsed.postgres.databaseUrlUnpooled,
        ),
        branch: process.env.NEON_BRANCH?.trim(),
        branchId: process.env.NEON_BRANCH_ID?.trim(),
      };
    }

    const parsed = parseEnv(neonConfig, ["DATABASE_URL"]);
    const url = normalizeNeonUrl(parsed.postgres.databaseUrl);
    return {
      databaseUrl: url,
      databaseUrlUnpooled: url,
      branch: process.env.NEON_BRANCH?.trim(),
      branchId: process.env.NEON_BRANCH_ID?.trim(),
    };
  } catch {
    const unpooled =
      process.env.DATABASE_URL_UNPOOLED?.trim() || rawDatabaseUrl;
    return {
      databaseUrl: normalizeNeonUrl(rawDatabaseUrl),
      databaseUrlUnpooled: normalizeNeonUrl(unpooled),
      branch: process.env.NEON_BRANCH?.trim(),
      branchId: process.env.NEON_BRANCH_ID?.trim(),
    };
  }
}

export function getDefaultOwnerCredentials() {
  const email = (
    process.env.OWNER_EMAIL || "estoce.orlan@gmail.com"
  ).trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD || "Orlandone2026!";
  return { email, password };
}

function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysUTC(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function parseDateKeyUTC(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

function seedBaselineVisits(): VisitRecord[] {
  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const seeded: VisitRecord[] = [];
  const devices: ("desktop" | "mobile" | "tablet")[] = [
    "desktop",
    "mobile",
    "desktop",
    "desktop",
    "mobile",
    "tablet",
  ];

  // Generate deterministic historical visits across the past 400 days so daily, weekly, monthly, and yearly charts have realistic comparison baselines
  for (let offset = 400; offset >= 0; offset--) {
    const d = addDaysUTC(todayUTC, -offset);
    const dateKey = formatDateKey(d);
    const daySeed = (offset * 17 + d.getUTCDay() * 7 + d.getUTCDate() * 3) % 11;
    const visitorCount = offset === 0 ? 6 : 2 + (daySeed % 7);

    for (let v = 0; v < visitorCount; v++) {
      const visitorHash = `seed-v-${dateKey}-${v}`;
      const hour = (8 + v * 2 + (offset % 5)) % 22;
      const deviceType = devices[(offset + v) % devices.length]!;
      seeded.push({
        visitDate: dateKey,
        visitHour: hour,
        visitorHash,
        path: "/",
        deviceType,
      });
      // Some visitors view multiple sections/pages
      if ((v + offset) % 2 === 0) {
        seeded.push({
          visitDate: dateKey,
          visitHour: (hour + 1) % 24,
          visitorHash,
          path: "/#projects",
          deviceType,
        });
      }
    }
  }
  return seeded;
}

export async function initStorage(): Promise<"neon" | "memory"> {
  if (initialized) return activeMode;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { email, password } = getDefaultOwnerCredentials();
    const defaultHash = await bcrypt.hash(password, 10);

    const neonEnv = resolveNeonPostgresEnv();
    if (neonEnv) {
      try {
        const isLocal =
          neonEnv.databaseUrl.includes("localhost") ||
          neonEnv.databaseUrl.includes("127.0.0.1");
        const sslOption = isLocal ? false : { rejectUnauthorized: false };

        // Per Neon Postgres skill best practices:
        // Use the direct (DATABASE_URL_UNPOOLED) connection for schema migrations / DDL,
        // and the pooled (DATABASE_URL) connection for application query traffic.
        const migrationPool = new Pool({
          connectionString: neonEnv.databaseUrlUnpooled,
          ssl: sslOption,
          max: 2,
          idleTimeoutMillis: 10_000,
          connectionTimeoutMillis: 15_000,
        });

        try {
          await migrationPool.query(`
            CREATE TABLE IF NOT EXISTS owner_users (
              id SERIAL PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS portfolio_content (
              key TEXT PRIMARY KEY,
              data JSONB NOT NULL,
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS media_assets (
              id TEXT PRIMARY KEY,
              filename TEXT NOT NULL,
              mime_type TEXT NOT NULL,
              bytes BYTEA NOT NULL,
              size_bytes INT NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS portfolio_visits (
              id BIGSERIAL PRIMARY KEY,
              visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
              visit_hour SMALLINT NOT NULL DEFAULT 0,
              visitor_hash TEXT NOT NULL,
              path TEXT NOT NULL DEFAULT '/',
              device_type TEXT NOT NULL DEFAULT 'desktop'
            );

            CREATE INDEX IF NOT EXISTS idx_portfolio_visits_date
              ON portfolio_visits (visit_date);
          `);
        } finally {
          await migrationPool.end().catch(() => undefined);
        }

        pool = new Pool({
          connectionString: neonEnv.databaseUrl,
          ssl: sslOption,
          max: 5,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 15_000,
        });
        attachDatabasePool(pool);

        const existingOwner = await pool.query(
          "SELECT id FROM owner_users LIMIT 1",
        );
        if (existingOwner.rowCount === 0) {
          await pool.query(
            "INSERT INTO owner_users (email, password_hash) VALUES ($1, $2)",
            [email, defaultHash],
          );
        }

        const existingContent = await pool.query(
          "SELECT key FROM portfolio_content WHERE key = 'main' LIMIT 1",
        );
        if (existingContent.rowCount === 0) {
          const initialContent = getInitialSeedContent();
          await pool.query(
            "INSERT INTO portfolio_content (key, data) VALUES ('main', $1::jsonb)",
            [JSON.stringify(initialContent)],
          );
          cachedPortfolioContent = {
            data: initialContent,
            fetchedAt: Date.now(),
          };
        }

        const existingVisits = await pool.query(
          "SELECT id FROM portfolio_visits LIMIT 1",
        );
        if (existingVisits.rowCount === 0) {
          const baseline = seedBaselineVisits();
          const dates = baseline.map((v) => v.visitDate);
          const hours = baseline.map((v) => v.visitHour);
          const hashes = baseline.map((v) => v.visitorHash);
          const paths = baseline.map((v) => v.path);
          const devices = baseline.map((v) => v.deviceType);

          await pool.query(
            `INSERT INTO portfolio_visits (visit_date, visit_hour, visitor_hash, path, device_type)
             SELECT * FROM UNNEST($1::date[], $2::smallint[], $3::text[], $4::text[], $5::text[])`,
            [dates, hours, hashes, paths, devices],
          );
        }

        activeMode = "neon";
        initialized = true;
        return activeMode;
      } catch (error) {
        console.warn(
          "Neon PostgreSQL connection failed, falling back to in-memory store:",
          error instanceof Error ? error.message : error,
        );
        pool = null;
      }
    }

    // Initialize fallback store
    memoryOwner = {
      id: 1,
      email,
      passwordHash: defaultHash,
      updatedAt: new Date().toISOString(),
    };
    memoryContent = getInitialSeedContent();
    if (memoryVisits.length === 0) {
      memoryVisits.push(...seedBaselineVisits());
    }
    activeMode = "memory";
    initialized = true;
    return activeMode;
  })();

  return initPromise;
}

export function getStorageMode(): "neon" | "memory" {
  return activeMode;
}

export async function getOwnerByEmail(
  email: string,
): Promise<OwnerUser | null> {
  await initStorage();
  const normalized = email.trim().toLowerCase();
  if (pool && activeMode === "neon") {
    const res = await pool.query(
      "SELECT id, email, password_hash AS \"passwordHash\", updated_at AS \"updatedAt\" FROM owner_users WHERE LOWER(email) = $1 LIMIT 1",
      [normalized],
    );
    return res.rows[0] || null;
  }
  if (memoryOwner && memoryOwner.email.toLowerCase() === normalized) {
    return memoryOwner;
  }
  return null;
}

export async function getOwnerById(id: number): Promise<OwnerUser | null> {
  await initStorage();
  if (pool && activeMode === "neon") {
    const res = await pool.query(
      "SELECT id, email, password_hash AS \"passwordHash\", updated_at AS \"updatedAt\" FROM owner_users WHERE id = $1 LIMIT 1",
      [id],
    );
    return res.rows[0] || null;
  }
  if (memoryOwner && memoryOwner.id === id) {
    return memoryOwner;
  }
  return null;
}

export async function updateOwnerCredentials(
  id: number,
  nextEmail: string,
  nextPasswordHash: string,
): Promise<OwnerUser> {
  await initStorage();
  const normalized = nextEmail.trim().toLowerCase();
  if (pool && activeMode === "neon") {
    const res = await pool.query(
      "UPDATE owner_users SET email = $1, password_hash = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, password_hash AS \"passwordHash\", updated_at AS \"updatedAt\"",
      [normalized, nextPasswordHash, id],
    );
    return res.rows[0];
  }
  memoryOwner = {
    id,
    email: normalized,
    passwordHash: nextPasswordHash,
    updatedAt: new Date().toISOString(),
  };
  return memoryOwner;
}

export async function getPortfolioContent(): Promise<SeededPortfolioContent> {
  await initStorage();
  if (pool && activeMode === "neon") {
    if (
      cachedPortfolioContent &&
      Date.now() - cachedPortfolioContent.fetchedAt < PORTFOLIO_CACHE_TTL_MS
    ) {
      return cachedPortfolioContent.data;
    }
    const res = await pool.query(
      "SELECT data FROM portfolio_content WHERE key = 'main' LIMIT 1",
    );
    if (res.rows[0]?.data) {
      const data = res.rows[0].data as SeededPortfolioContent;
      cachedPortfolioContent = {
        data,
        fetchedAt: Date.now(),
      };
      return data;
    }
  }
  return memoryContent;
}

export async function savePortfolioContent(
  content: SeededPortfolioContent,
): Promise<SeededPortfolioContent> {
  await initStorage();
  const cloned = structuredClone(content);
  if (pool && activeMode === "neon") {
    await pool.query(
      `INSERT INTO portfolio_content (key, data, updated_at)
       VALUES ('main', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(cloned)],
    );
    cachedPortfolioContent = {
      data: cloned,
      fetchedAt: Date.now(),
    };
  }
  memoryContent = cloned;
  return memoryContent;
}

export async function resetPortfolioContent(): Promise<SeededPortfolioContent> {
  const initial = getInitialSeedContent();
  return savePortfolioContent(initial);
}

export async function saveMediaAsset(input: {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<{ id: string; filename: string; mimeType: string; sizeBytes: number }> {
  await initStorage();
  const id = crypto.randomUUID();
  const cleanName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "asset";
  const sizeBytes = input.bytes.byteLength;

  if (pool && activeMode === "neon") {
    await pool.query(
      "INSERT INTO media_assets (id, filename, mime_type, bytes, size_bytes) VALUES ($1, $2, $3, $4, $5)",
      [id, cleanName, input.mimeType, input.bytes, sizeBytes],
    );
  } else {
    memoryMedia.set(id, {
      id,
      filename: cleanName,
      mimeType: input.mimeType,
      bytes: input.bytes,
      sizeBytes,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    id,
    filename: cleanName,
    mimeType: input.mimeType,
    sizeBytes,
  };
}

export async function getMediaAsset(
  id: string,
): Promise<MediaAssetRecord | null> {
  await initStorage();
  if (pool && activeMode === "neon") {
    const res = await pool.query(
      "SELECT id, filename, mime_type AS \"mimeType\", bytes, size_bytes AS \"sizeBytes\", created_at AS \"createdAt\" FROM media_assets WHERE id = $1 LIMIT 1",
      [id],
    );
    return res.rows[0] || null;
  }
  return memoryMedia.get(id) || null;
}

export async function deleteMediaAsset(id: string): Promise<void> {
  await initStorage();
  if (pool && activeMode === "neon") {
    await pool.query("DELETE FROM media_assets WHERE id = $1", [id]);
    return;
  }
  memoryMedia.delete(id);
}

export async function getDatabaseDiagnostics(): Promise<{
  storageMode: "neon" | "memory";
  pooledConfigured: boolean;
  unpooledConfigured: boolean;
  branch?: string;
  branchId?: string;
  database?: string;
  role?: string;
  counts?: {
    ownerUsers: number;
    portfolioContent: number;
    mediaAssets: number;
    portfolioVisits: number;
  };
}> {
  await initStorage();
  const neonEnv = resolveNeonPostgresEnv();
  if (pool && activeMode === "neon") {
    const res = await pool.query(`
      SELECT current_database() AS database,
             current_user AS role,
             (SELECT COUNT(*)::int FROM owner_users) AS "ownerUsers",
             (SELECT COUNT(*)::int FROM portfolio_content) AS "portfolioContent",
             (SELECT COUNT(*)::int FROM media_assets) AS "mediaAssets",
             (SELECT COUNT(*)::int FROM portfolio_visits) AS "portfolioVisits"
    `);
    const row = res.rows[0];
    return {
      storageMode: activeMode,
      pooledConfigured: Boolean(neonEnv?.databaseUrl.includes("-pooler")),
      unpooledConfigured: Boolean(
        neonEnv?.databaseUrlUnpooled &&
          !neonEnv.databaseUrlUnpooled.includes("-pooler"),
      ),
      branch: neonEnv?.branch,
      branchId: neonEnv?.branchId,
      database: row?.database,
      role: row?.role,
      counts: {
        ownerUsers: Number(row?.ownerUsers ?? 0),
        portfolioContent: Number(row?.portfolioContent ?? 0),
        mediaAssets: Number(row?.mediaAssets ?? 0),
        portfolioVisits: Number(row?.portfolioVisits ?? 0),
      },
    };
  }
  return {
    storageMode: activeMode,
    pooledConfigured: false,
    unpooledConfigured: false,
  };
}

export async function recordVisit(input: {
  visitorHash: string;
  path: string;
  deviceType: "desktop" | "mobile" | "tablet";
}): Promise<void> {
  await initStorage();
  const now = new Date();
  const visitDate = formatDateKey(now);
  const visitHour = now.getUTCHours();

  if (pool && activeMode === "neon") {
    await pool.query(
      "INSERT INTO portfolio_visits (visit_date, visit_hour, visitor_hash, path, device_type) VALUES ($1::date, $2, $3, $4, $5)",
      [visitDate, visitHour, input.visitorHash, input.path, input.deviceType],
    );
    return;
  }

  memoryVisits.push({
    visitDate,
    visitHour,
    visitorHash: input.visitorHash,
    path: input.path,
    deviceType: input.deviceType,
  });
}

function calcChangePct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function summarizeRange(
  byDate: Map<string, VisitRecord[]>,
  startDate: Date,
  daysCount: number,
): { views: number; unique: number } {
  let views = 0;
  const uniqueSet = new Set<string>();
  for (let i = 0; i < daysCount; i++) {
    const key = formatDateKey(addDaysUTC(startDate, i));
    const list = byDate.get(key);
    if (!list) continue;
    views += list.length;
    for (const item of list) {
      uniqueSet.add(item.visitorHash);
    }
  }
  return { views, unique: uniqueSet.size };
}

function buildComparison(
  byDate: Map<string, VisitRecord[]>,
  todayUTC: Date,
  periodDays: number,
): PeriodComparison {
  const currentStart = addDaysUTC(todayUTC, -(periodDays - 1));
  const previousStart = addDaysUTC(currentStart, -periodDays);
  const curr = summarizeRange(byDate, currentStart, periodDays);
  const prev = summarizeRange(byDate, previousStart, periodDays);
  return {
    currentViews: curr.views,
    previousViews: prev.views,
    viewsChangePct: calcChangePct(curr.views, prev.views),
    currentUnique: curr.unique,
    previousUnique: prev.unique,
    uniqueChangePct: calcChangePct(curr.unique, prev.unique),
  };
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function getAnalyticsSummary(
  requestedDate?: string,
): Promise<AnalyticsSummary> {
  await initStorage();

  let visits: VisitRecord[] = memoryVisits;
  if (pool && activeMode === "neon") {
    const res = await pool.query(
      `SELECT TO_CHAR(visit_date, 'YYYY-MM-DD') AS "visitDate",
              visit_hour AS "visitHour",
              visitor_hash AS "visitorHash",
              path,
              device_type AS "deviceType"
         FROM portfolio_visits
        WHERE visit_date >= CURRENT_DATE - INTERVAL '1460 days'
        ORDER BY visit_date ASC, id ASC
        LIMIT 50000`,
    );
    visits = res.rows;
  }

  const byDate = new Map<string, VisitRecord[]>();
  const allUnique = new Set<string>();
  const devices = { desktop: 0, mobile: 0, tablet: 0 };

  for (const v of visits) {
    allUnique.add(v.visitorHash);
    if (v.deviceType === "mobile") devices.mobile++;
    else if (v.deviceType === "tablet") devices.tablet++;
    else devices.desktop++;

    const list = byDate.get(v.visitDate) ?? [];
    list.push(v);
    byDate.set(v.visitDate, list);
  }

  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  // Comparisons: Daily (1d vs prior 1d), Weekly (7d vs prior 7d), Monthly (30d vs prior 30d), Yearly (365d vs prior 365d)
  const comparisons = {
    daily: buildComparison(byDate, todayUTC, 1),
    weekly: buildComparison(byDate, todayUTC, 7),
    monthly: buildComparison(byDate, todayUTC, 30),
    yearly: buildComparison(byDate, todayUTC, 365),
  };

  // 1. Daily series: last 14 days (with prior 14-day period comparison)
  const dailySeries: TimeSeriesPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDaysUTC(todayUTC, -i);
    const prevD = addDaysUTC(d, -14);
    const key = formatDateKey(d);
    const curr = summarizeRange(byDate, d, 1);
    const prev = summarizeRange(byDate, prevD, 1);
    dailySeries.push({
      key,
      label: `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`,
      views: curr.views,
      uniqueVisitors: curr.unique,
      previousViews: prev.views,
      previousUniqueVisitors: prev.unique,
    });
  }

  // 2. Weekly series: last 12 weeks
  const weeklySeries: TimeSeriesPoint[] = [];
  for (let w = 11; w >= 0; w--) {
    const endDay = addDaysUTC(todayUTC, -w * 7);
    const startDay = addDaysUTC(endDay, -6);
    const prevStartDay = addDaysUTC(startDay, -7 * 12);
    const curr = summarizeRange(byDate, startDay, 7);
    const prev = summarizeRange(byDate, prevStartDay, 7);
    weeklySeries.push({
      key: formatDateKey(startDay),
      label: `${MONTH_NAMES[startDay.getUTCMonth()]} ${startDay.getUTCDate()}`,
      views: curr.views,
      uniqueVisitors: curr.unique,
      previousViews: prev.views,
      previousUniqueVisitors: prev.unique,
    });
  }

  // 3. Monthly series: last 12 months
  const monthlySeries: TimeSeriesPoint[] = [];
  for (let m = 11; m >= 0; m--) {
    const year = todayUTC.getUTCFullYear();
    const month = todayUTC.getUTCMonth() - m;
    const monthStart = new Date(Date.UTC(year, month, 1));
    const nextMonthStart = new Date(Date.UTC(year, month + 1, 1));
    const daysInMonth = Math.round(
      (nextMonthStart.getTime() - monthStart.getTime()) / 86_400_000,
    );
    const prevYearMonthStart = new Date(
      Date.UTC(monthStart.getUTCFullYear() - 1, monthStart.getUTCMonth(), 1),
    );
    const curr = summarizeRange(byDate, monthStart, daysInMonth);
    const prev = summarizeRange(byDate, prevYearMonthStart, daysInMonth);
    monthlySeries.push({
      key: `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${MONTH_NAMES[monthStart.getUTCMonth()]} '${String(monthStart.getUTCFullYear()).slice(-2)}`,
      views: curr.views,
      uniqueVisitors: curr.unique,
      previousViews: prev.views,
      previousUniqueVisitors: prev.unique,
    });
  }

  // 4. Yearly series: last 4 years
  const yearlySeries: TimeSeriesPoint[] = [];
  const currentYear = todayUTC.getUTCFullYear();
  for (let y = 3; y >= 0; y--) {
    const targetYear = currentYear - y;
    let views = 0;
    const uniqueSet = new Set<string>();
    let prevViews = 0;
    const prevUniqueSet = new Set<string>();
    const prefix = `${targetYear}-`;
    const prevPrefix = `${targetYear - 1}-`;
    for (const [dateKey, list] of byDate.entries()) {
      if (dateKey.startsWith(prefix)) {
        views += list.length;
        for (const item of list) uniqueSet.add(item.visitorHash);
      } else if (dateKey.startsWith(prevPrefix)) {
        prevViews += list.length;
        for (const item of list) prevUniqueSet.add(item.visitorHash);
      }
    }
    yearlySeries.push({
      key: String(targetYear),
      label: String(targetYear),
      views,
      uniqueVisitors: uniqueSet.size,
      previousViews: prevViews,
      previousUniqueVisitors: prevUniqueSet.size,
    });
  }

  // 5. Selected Day breakdown (with 24-hour distribution and prior-day comparison)
  const targetDateObj = requestedDate
    ? parseDateKeyUTC(requestedDate)
    : todayUTC;
  const targetDateKey = formatDateKey(targetDateObj);
  const prevDateObj = addDaysUTC(targetDateObj, -1);
  const prevDateKey = formatDateKey(prevDateObj);

  const dayList = byDate.get(targetDateKey) ?? [];
  const prevDayList = byDate.get(prevDateKey) ?? [];

  const dayUnique = new Set(dayList.map((v) => v.visitorHash)).size;
  const prevDayUnique = new Set(prevDayList.map((v) => v.visitorHash)).size;

  const hourly = Array.from({ length: 24 }, (_, hourIndex) => {
    const inHour = dayList.filter((v) => Number(v.visitHour) === hourIndex);
    const hourUnique = new Set(inHour.map((v) => v.visitorHash)).size;
    return {
      hour: `${String(hourIndex).padStart(2, "0")}:00`,
      views: inHour.length,
      uniqueVisitors: hourUnique,
    };
  });

  return {
    totalViewsAllTime: visits.length,
    totalUniqueAllTime: allUnique.size,
    comparisons,
    series: {
      daily: dailySeries,
      weekly: weeklySeries,
      monthly: monthlySeries,
      yearly: yearlySeries,
    },
    selectedDay: {
      date: targetDateKey,
      views: dayList.length,
      uniqueVisitors: dayUnique,
      previousDate: prevDateKey,
      previousViews: prevDayList.length,
      previousUniqueVisitors: prevDayUnique,
      viewsChangePct: calcChangePct(dayList.length, prevDayList.length),
      uniqueChangePct: calcChangePct(dayUnique, prevDayUnique),
      hourly,
    },
    devices,
  };
}
