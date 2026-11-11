import { useState } from "react";
import { ArrowUpRight, Check, Github, FolderOpen } from "lucide-react";
import { projects, projectCategories } from "../data/projects";
import type { Project, ProjectCategory } from "../data/projects";
import { Reveal, SectionHeading } from "../components/Shared";
import ProjectCard from "../components/ProjectCard";
import ProjectVisual from "../components/ProjectVisual";
import { Modal } from "../components/Modal";

export default function Projects() {
  const [category, setCategory] = useState<ProjectCategory>("All projects");
  const [selected, setSelected] = useState<Project | null>(null);
  const [expanded, setExpanded] = useState(false);
  const filtered = projects.filter(
    (project) =>
      category === "All projects" || project.categories.includes(category),
  );
  const visible = expanded ? filtered : filtered.slice(0, 6);
  return (
    <section
      id="projects"
      className="section section-white"
      aria-label="Featured projects"
    >
      <div className="container">
        <Reveal>
          <SectionHeading
            number="03"
            label="Selected work"
            title="From a thought to a thing."
            description="Mobile applications, business systems, and machine learning experiments. Explore the code and the ideas behind each project."
          />
        </Reveal>
        <div
          className="project-filter"
          role="group"
          aria-label="Filter projects"
        >
          {projectCategories.map((item) => (
            <button
              key={item}
              aria-pressed={category === item}
              onClick={() => {
                setCategory(item);
                setExpanded(false);
              }}
            >
              {item}
              {item === "All projects" && (
                <span>{projects.length.toString().padStart(2, "0")}</span>
              )}
            </button>
          ))}
        </div>
        <p className="sr-only" role="status">
          Showing {visible.length} of {filtered.length} matching projects
        </p>
        {filtered.length ? (
          <div className="projects-grid">
            {visible.map((project) => (
              <Reveal key={project.id}>
                <ProjectCard
                  project={project}
                  index={projects.indexOf(project)}
                  onOpen={() => setSelected(project)}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FolderOpen size={30} />
            <h3>No projects in this category yet.</h3>
            <p>Explore the other projects while this collection grows.</p>
            <button
              className="button button-secondary"
              onClick={() => setCategory("All projects")}
            >
              View all projects
            </button>
          </div>
        )}
        {filtered.length > 6 && (
          <div className="project-expand">
            <button
              className="button button-secondary"
              aria-expanded={expanded}
              onClick={() => {
                setExpanded(!expanded);
                if (expanded)
                  document.getElementById("projects")?.scrollIntoView();
              }}
            >
              {expanded
                ? "Show featured projects"
                : `View all ${filtered.length} projects`}
              <ArrowUpRight size={16} />
            </button>
          </div>
        )}
        <div className="projects-footnote">
          <span>
            {visible.length} of {filtered.length} projects · An ongoing learning
            journey.
          </span>
          <a
            href="https://github.com/estoceorlan-dev?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore GitHub <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || "Project details"}
        className="project-modal"
      >
        {selected && (
          <>
            <ProjectVisual project={selected} />
            <p className="eyebrow mt-6">{selected.category}</p>
            {(selected.year || selected.status) && (
              <p className="project-status">
                {[selected.year, selected.status].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="modal-description">{selected.description}</p>
            <h3 className="detail-heading">What it explores</h3>
            <ul className="feature-list">
              {selected.features.map((feature) => (
                <li key={feature}>
                  <Check size={16} />
                  {feature}
                </li>
              ))}
            </ul>
            <h3 className="detail-heading">Built with</h3>
            <div className="tags">
              {selected.technologies.map((technology) => (
                <span key={technology}>{technology}</span>
              ))}
            </div>
            {selected.role && (
              <>
                <h3 className="detail-heading">My contribution</h3>
                <p className="muted">{selected.role}</p>
              </>
            )}
            {selected.notes && (
              <div className="project-scope">
                <h3 className="detail-heading">Project scope</h3>
                {selected.notes.map((note) => (
                  <p className="muted" key={note}>
                    {note}
                  </p>
                ))}
              </div>
            )}
            <div className="project-links">
              {selected.repository ? (
                <a
                  className="button button-secondary"
                  href={selected.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github size={16} />
                  View repository
                </a>
              ) : (
                <span>
                  <Github size={16} />
                  Repository link to be added
                </span>
              )}
              {selected.additionalRepositories?.map((repository) => (
                <a
                  className="button button-secondary"
                  href={repository.url}
                  key={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github size={16} />
                  {repository.label}
                </a>
              ))}
              {selected.demo && (
                <a
                  className="button button-primary"
                  href={selected.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selected.demoLabel || "Live demo"} <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
