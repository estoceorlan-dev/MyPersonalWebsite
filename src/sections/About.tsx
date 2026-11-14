import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Users,
} from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import { Reveal, SectionHeading } from "../components/Shared";

const interestIcons = [Lightbulb, Users, BookOpen];

export default function About() {
  const { content } = usePortfolio();
  const { personal, sectionHeadings } = content;
  return (
    <section id="about" className="section section-white" aria-label="About me">
      <div className="container">
        <Reveal>
          <SectionHeading
            number="01"
            label={sectionHeadings.about.label}
            title={sectionHeadings.about.title}
            description={sectionHeadings.about.description}
          />
        </Reveal>
        <div className="about-grid">
          <Reveal className="about-copy">
            <p className="large-copy">
              {personal.aboutLeadLine1 || "Curious by nature."}
              <br />
              {personal.aboutLeadLine2 || "Precise by"}{" "}
              <span>{personal.aboutLeadHighlight || "practice."}</span>
            </p>
            {personal.about.map((paragraph, idx) => (
              <p key={`${idx}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))}
            <a className="text-link" href="#contact">
              Let’s connect <ArrowUpRight size={17} />
            </a>
          </Reveal>
          <Reveal className="about-details" delay={0.08}>
            <div className="education-card">
              <div className="card-topline">
                <GraduationCap size={24} />
                <span>
                  {personal.educationCardHeader || "CURRENTLY LEARNING"}
                </span>
              </div>
              <h3>{personal.degree}</h3>
              <p>{personal.school}</p>
              <div className="education-card-bottom">
                <span>{personal.academicYear}</span>
                <span className="status-pill">
                  <span className="status-dot" />
                  {personal.occupationStatusPill || "Student"}
                </span>
              </div>
            </div>
            <div className="values-list">
              {personal.interests.map((item, idx) => {
                const Icon = interestIcons[idx % interestIcons.length]!;
                return (
                  <div key={`${item.title}-${idx}`}>
                    <Icon size={19} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="languages">
              <span>Languages</span>
              <p>{personal.languages.join(" · ")}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
