import {
  Braces,
  Database,
  LayoutTemplate,
  Server,
  Wrench,
  ArrowDownRight,
} from "lucide-react";
import { skillGroups } from "../data/skills";
import { Reveal, SectionHeading } from "../components/Shared";

const icons = {
  code: Braces,
  layout: LayoutTemplate,
  server: Server,
  database: Database,
  tools: Wrench,
};
export default function Skills() {
  const hasSkills = skillGroups.some((group) => group.skills.length);
  return (
    <section id="skills" className="section" aria-label="Technical skills">
      <div className="container">
        <Reveal>
          <SectionHeading
            number="02"
            label="My toolkit"
            title="The tools behind the ideas."
            description="A place for the languages, frameworks, and tools I use to turn an idea into something tangible."
          />
        </Reveal>
        <div className="skills-grid">
          {skillGroups.map((group, index) => {
            const Icon = icons[group.icon];
            return (
              <Reveal key={group.title} delay={index * 0.04}>
                <article className="skill-card">
                  <Icon size={23} strokeWidth={1.6} />
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                  <div className="skill-tags">
                    {group.skills.length ? (
                      group.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))
                    ) : (
                      <span className="pending-skill">Skills to be added</span>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        {!hasSkills && (
          <p className="section-note">
            This toolkit is awaiting confirmed skills.{" "}
            <a href="#projects">
              Explore the technologies used in my projects{" "}
              <ArrowDownRight size={14} />
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
