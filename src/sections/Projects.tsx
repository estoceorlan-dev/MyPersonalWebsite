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
  const filtered = projects.filter(
    (project) =>
      category === "All projects" || project.categories.includes(category),
  );
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
            description="A selection of projects across mobile, web, and machine learning. Each one is a chance to learn by doing."
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
              onClick={() => setCategory(item)}
            >
              {item}
              {item === "All projects" && (
                <span>{projects.length.toString().padStart(2, "0")}</span>
              )}
            </button>
          ))}
        </div>
        <p className="sr-only" role="status">
          {filtered.length} {filtered.length === 1 ? "project" : "projects"}{" "}
          shown
        </p>
        {filtered.length ? (
          <div className="projects-grid">
            {filtered.map((project) => (
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
        <div className="projects-footnote">
          <span>A small collection. An ongoing learning journey.</span>
          <span>
            More to build <ArrowUpRight size={16} />
          </span>
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
            <h3 className="detail-heading">My contribution</h3>
            <p className="muted">{selected.role}</p>
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
              {selected.demo ? (
                <a
                  className="button button-primary"
                  href={selected.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Live demo <ArrowUpRight size={16} />
                </a>
              ) : (
                <span>
                  <ArrowUpRight size={16} />
                  Live demo not provided
                </span>
              )}
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
