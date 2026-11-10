import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Users,
} from "lucide-react";
import { personal } from "../data/personal";
import { Reveal, SectionHeading } from "../components/Shared";

export default function About() {
  return (
    <section id="about" className="section section-white" aria-label="About me">
      <div className="container">
        <Reveal>
          <SectionHeading
            number="01"
            label="A little about me"
            title="Curiosity is where it starts."
          />
        </Reveal>
        <div className="about-grid">
          <Reveal className="about-copy">
            <p className="large-copy">
              A student by title.
              <br />A builder by <span>curiosity.</span>
            </p>
            {personal.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <a className="text-link" href="#contact">
              Let’s connect <ArrowUpRight size={17} />
            </a>
          </Reveal>
          <Reveal className="about-details" delay={0.08}>
            <div className="education-card">
              <div className="card-topline">
                <GraduationCap size={24} />
                <span>CURRENTLY LEARNING</span>
              </div>
              <h3>{personal.degree}</h3>
              <p>{personal.school}</p>
              <div className="education-card-bottom">
                <span>{personal.academicYear}</span>
                <span className="status-pill">
                  <span className="status-dot" />
                  Student
                </span>
              </div>
            </div>
            <div className="values-list">
              {[
                {
                  icon: Lightbulb,
                  title: personal.interests[0],
                  text: "An interest in useful, approachable digital products.",
                },
                {
                  icon: Users,
                  title: personal.interests[1],
                  text: "A willingness to contribute and learn alongside a team.",
                },
                {
                  icon: BookOpen,
                  title: personal.interests[2],
                  text: "Looking for opportunities to put knowledge into practice.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon size={19} />
                  <span>
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
