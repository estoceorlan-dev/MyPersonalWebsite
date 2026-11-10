import { BookOpen, GraduationCap, BriefcaseBusiness } from "lucide-react";
import type { TimelineEntry } from "../data/experience";

export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="timeline">
      {entries.map((entry) => {
        const Icon =
          entry.kind === "education"
            ? GraduationCap
            : entry.kind === "work"
              ? BriefcaseBusiness
              : BookOpen;
        return (
          <li key={`${entry.title}-${entry.date}`}>
            <div className="timeline-icon">
              <Icon size={21} />
            </div>
            <div className="timeline-date">{entry.date}</div>
            <div className="timeline-content">
              <span className="eyebrow">
                {entry.kind === "education"
                  ? "Education"
                  : entry.kind === "work"
                    ? "Experience"
                    : "Practical learning"}
              </span>
              <h3>{entry.title}</h3>
              <p className="timeline-org">{entry.organization}</p>
              <p className="muted">{entry.description}</p>
              <ul>
                {entry.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
