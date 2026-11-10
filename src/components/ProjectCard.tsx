import { ArrowUpRight } from "lucide-react";
import type { Project } from "../data/projects";
import ProjectVisual from "./ProjectVisual";

export default function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  return (
    <article className="project-card">
      <ProjectVisual project={project} />
      <div className="project-body">
        <p className="project-category">
          <span>{project.category}</span>
          <span>0{index + 1}</span>
        </p>
        <h3>
          <button onClick={onOpen} aria-label={`View ${project.title} details`}>
            {project.title}
            <ArrowUpRight size={22} />
          </button>
        </h3>
        <p className="project-description">{project.description}</p>
        <div className="tags">
          {project.technologies.slice(0, 3).map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
          {project.technologies.length > 3 && (
            <span>+{project.technologies.length - 3}</span>
          )}
        </div>
      </div>
    </article>
  );
}
