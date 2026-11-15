import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { ArrowDown, ArrowUp, FolderGit2, GripVertical } from "lucide-react";
import type { Project } from "../data/projects";
import { resolveMediaUrl } from "../context/PortfolioContext";

type ProjectOrderListProps = {
  projects: Project[];
  activeProjectId?: string;
  onSelect: (index: number) => void;
  onReorder: (ids: string[]) => void;
};

export default function ProjectOrderList({
  projects,
  activeProjectId,
  onSelect,
  onReorder,
}: ProjectOrderListProps) {
  const ids = projects.map((project) => project.id);

  function moveProject(from: number, to: number) {
    const next = [...ids];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id!);
    onReorder(next);
  }

  return (
    <Reorder.Group
      as="ol"
      axis="y"
      values={ids}
      onReorder={onReorder}
      className="owner-project-list"
      aria-label="Project display order"
      aria-describedby="project-order-help"
    >
      {projects.map((project, index) => (
        <ProjectOrderItem
          key={project.id}
          project={project}
          index={index}
          selected={project.id === activeProjectId}
          first={index === 0}
          last={index === projects.length - 1}
          onSelect={() => onSelect(index)}
          onMove={(offset) => moveProject(index, index + offset)}
        />
      ))}
    </Reorder.Group>
  );
}

function ProjectOrderItem({
  project,
  index,
  selected,
  first,
  last,
  onSelect,
  onMove,
}: {
  project: Project;
  index: number;
  selected: boolean;
  first: boolean;
  last: boolean;
  onSelect: () => void;
  onMove: (offset: number) => void;
}) {
  const dragControls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const cover = project.image || project.gallery?.[0]?.src;

  return (
    <Reorder.Item
      as="li"
      value={project.id}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      className={`owner-project-row${selected ? " is-active" : ""}${dragging ? " is-dragging" : ""}`}
    >
      <button
        type="button"
        className="icon-button owner-project-drag"
        aria-label={`Drag to reorder ${project.title}`}
        title="Drag to reorder; use the arrow buttons with a keyboard"
        onPointerDown={(event) => dragControls.start(event)}
      >
        <GripVertical size={17} />
      </button>
      <button
        type="button"
        className="owner-project-select"
        aria-haspopup="dialog"
        aria-label={`Edit ${project.title}`}
        onClick={onSelect}
      >
        <small className="owner-project-position">
          {String(index + 1).padStart(2, "0")}
        </small>
        <span className={`owner-project-cover tone-${project.cover?.tone || "lavender"}`}>
          {cover ? (
            <img src={resolveMediaUrl(cover)} alt="" loading="lazy" draggable={false} />
          ) : (
            <FolderGit2 size={22} aria-hidden="true" />
          )}
        </span>
        <span className="owner-project-info">
          <span className="owner-project-title">{project.title}</span>
          <span className="owner-project-category">{project.category}</span>
        </span>
      </button>
      <div className="owner-inline-actions">
        <button
          type="button"
          className="icon-button"
          aria-label={`Move ${project.title} up`}
          disabled={first}
          onClick={() => onMove(-1)}
        >
          <ArrowUp size={15} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={`Move ${project.title} down`}
          disabled={last}
          onClick={() => onMove(1)}
        >
          <ArrowDown size={15} />
        </button>
      </div>
    </Reorder.Item>
  );
}
