import { ArrowUpRight } from "lucide-react";
import { education, experience } from "../data/experience";
import { Reveal, SectionHeading } from "../components/Shared";
import Timeline from "../components/Timeline";

export default function Experience() {
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
            label="The journey so far"
            title="Building a foundation."
            description="Education, hands-on projects, and the next chapter: learning alongside a professional team."
          />
        </Reveal>
        <Reveal>
          <Timeline entries={[...education, ...experience]} />
          <div className="next-chapter">
            <span className="status-dot" />
            <div>
              <strong>The next chapter could be with your team.</strong>
              <p>Looking for an IT internship and room to grow.</p>
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
