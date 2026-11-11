import {
  Activity,
  ArrowUpRight,
  Leaf,
  ScanLine,
  Sparkles,
  Store,
  Flower2,
  Search,
  ReceiptText,
  Utensils,
  Scissors,
  Guitar,
  Droplets,
  BrainCircuit,
} from "lucide-react";
import { useId } from "react";
import type { Project } from "../data/projects";
const coverIcons = {
  store: Store,
  flower: Flower2,
  search: Search,
  receipt: ReceiptText,
  utensils: Utensils,
  scissors: Scissors,
  guitar: Guitar,
  droplets: Droplets,
  brain: BrainCircuit,
};

export default function ProjectVisual({ project }: { project: Project }) {
  const gradientId = useId();
  const CoverIcon = project.cover ? coverIcons[project.cover.icon] : Store;
  if (project.image)
    return (
      <div className="project-visual project-visual-image">
        <img
          src={project.image}
          alt={project.imageAlt || `${project.title} project preview`}
          loading="lazy"
          width="800"
          height="600"
        />
      </div>
    );
  return (
    <div
      className={`project-visual preview-${project.preview} cover-${project.cover?.tone || "lavender"}`}
      role="img"
      aria-label={`${project.title} illustrative concept artwork, not an actual application screenshot`}
    >
      <span className="preview-label">
        {project.preview === "cover" ? "PROJECT COVER" : "ILLUSTRATIVE PREVIEW"}
      </span>
      {project.preview === "cover" && (
        <div className="cover-art" aria-hidden="true">
          <span className="cover-orbit" />
          <div className="cover-icon">
            <CoverIcon size={42} strokeWidth={1.25} />
          </div>
          <span className="cover-title">{project.title}</span>
          <span className="cover-label">{project.cover?.label}</span>
        </div>
      )}
      {project.preview === "wellness" && (
        <div className="wellness-art" aria-hidden="true">
          <div className="wellness-wordmark">
            <Activity size={18} /> vitalysync
          </div>
          <span className="wellness-caption">A little more balance.</span>
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-top">
              <span>Your wellbeing</span>
              <Leaf size={14} />
            </div>
            <strong>A moment for you.</strong>
            <span className="phone-subtitle">Check in. Reflect. Grow.</span>
            <div className="wellness-ring">
              <Leaf size={25} />
              <span>Find your balance</span>
            </div>
            <div className="phone-bottom">
              <span>
                <i />
                Mindful moments
              </span>
              <ArrowUpRight size={13} />
            </div>
            <div className="phone-chart">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <span className="wellness-leaf">
            <Leaf size={28} />
          </span>
        </div>
      )}
      {project.preview === "mango" && (
        <div className="mango-art" aria-hidden="true">
          <div className="scan-corner corner-tl" />
          <div className="scan-corner corner-tr" />
          <div className="scan-corner corner-bl" />
          <div className="scan-corner corner-br" />
          <svg viewBox="0 0 220 220" className="mango-svg">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#f7ce60" />
                <stop offset="1" stopColor="#e7a72c" />
              </linearGradient>
            </defs>
            <path
              d="M117 49C157 38 195 76 183 124C172 170 112 192 74 176C40 161 47 127 64 112C86 91 79 60 117 49Z"
              fill={`url(#${gradientId})`}
            />
            <path
              d="M119 54C125 30 153 18 169 25C157 49 136 55 119 54Z"
              fill="#688968"
            />
            <path
              d="M119 55l6-18"
              stroke="#536f4e"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M93 77C76 95 89 113 70 133"
              stroke="#ffe6a2"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <span className="mango-chip">
            <ScanLine size={14} /> An eye for the details
          </span>
          <div className="mango-dots">
            <i />
            <i />
            <i />
          </div>
        </div>
      )}
      {(project.preview === "redblue" || project.preview === "blueyellow") && (
        <div className="redblue-art" aria-hidden="true">
          <span className="redblue-top">TWO SIDES. ONE EXPERIENCE.</span>
          <div className="versus">
            <span className="red-shape" />
            <b>vs.</b>
            <span className="blue-shape" />
          </div>
          <div className="redblue-caption">
            <span>{project.preview === "blueyellow" ? "Blue" : "Red"}</span>
            <Sparkles size={15} />
            <span>{project.preview === "blueyellow" ? "Yellow" : "Blue"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
