import { ArrowUpRight } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import { Reveal, SectionHeading } from "../components/Shared";
import Timeline from "../components/Timeline";

export default function Experience() {
  const { content } = usePortfolio();
  const { education, experience, personal, sectionHeadings } = content;
  return (
    <section
      id="experience"
      className="section"
      aria-label="Experience and education"
    >
      <div className="container">
        <Reveal>
          <SectionHeading
            number="04"
            label={sectionHeadings.experience.label}
            title={sectionHeadings.experience.title}
            description={sectionHeadings.experience.description}
          />
        </Reveal>
        <Reveal>
          <Timeline entries={[...education, ...experience]} />
          <div className="next-chapter">
            <span className="status-dot" />
            <div>
              <strong>
                {personal.experienceCalloutTitle ||
                  "The next chapter could be with your team."}
              </strong>
              <p>
                {personal.experienceCalloutSubtitle ||
                  "Looking for an IT internship and room to grow."}
              </p>
            </div>
            <a href="#contact" className="text-link">
              Let’s talk <ArrowUpRight size={17} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
