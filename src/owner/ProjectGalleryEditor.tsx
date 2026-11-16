import { useId, useRef, useState } from "react";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import type { ProjectGalleryItem } from "../data/projects";
import { resolveMediaUrl } from "../context/PortfolioContext";

export default function ProjectGalleryEditor({
  images,
  title,
  onChange,
}: {
  images: ProjectGalleryItem[];
  title: string;
  onChange: (images: ProjectGalleryItem[]) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const helpId = useId();
  const [draggingSrc, setDraggingSrc] = useState<string | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  function findTarget(point: PanInfo["point"]): number | null {
    const list = listRef.current;
    if (!list) return null;
    const bounds = list.getBoundingClientRect();
    const x = point.x - window.scrollX;
    const y = point.y - window.scrollY;
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null;

    // Layout offsets stay in place while the dragged thumbnail is transformed.
    // Re-measuring the list also handles scrolling within the project dialog.
    let nearest: number | null = null;
    let distance = Infinity;
    Array.from(list.children).forEach((child, index) => {
      const item = child as HTMLElement;
      const centerX = bounds.left + item.offsetLeft + item.offsetWidth / 2;
      const centerY = bounds.top + item.offsetTop + item.offsetHeight / 2;
      const nextDistance = (x - centerX) ** 2 + (y - centerY) ** 2;
      if (nextDistance < distance) {
        nearest = index;
        distance = nextDistance;
      }
    });
    return nearest;
  }

  function moveImage(from: number, to: number) {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [image] = next.splice(from, 1);
    next.splice(to, 0, image!);
    onChange(next);
    setAnnouncement(`${image!.label || `Image ${from + 1}`} moved to position ${to + 1} of ${images.length}.`);
  }

  return (
    <>
      <p id={helpId} className="muted mt-3">
        Drag the handles to rearrange images, or use the arrows. Image names appear
        in the project carousel. Save changes to publish.
      </p>
      <ol
        ref={listRef}
        className="owner-gallery-list mt-3"
        aria-label="Project gallery images"
        aria-describedby={helpId}
      >
        {images.map((image, index) => (
          <GalleryImage
            key={image.src}
            image={image}
            index={index}
            total={images.length}
            dragging={draggingSrc === image.src}
            dropTarget={targetIndex === index && draggingSrc !== image.src}
            onDragStart={() => {
              setDraggingSrc(image.src);
              setTargetIndex(index);
            }}
            onDrag={(point) => setTargetIndex(findTarget(point))}
            onDragEnd={(point) => {
              const target = findTarget(point);
              setDraggingSrc(null);
              setTargetIndex(null);
              if (target !== null) moveImage(index, target);
            }}
            onMove={(offset) => moveImage(index, index + offset)}
            onRename={(label) => onChange(images.map((item, itemIndex) =>
              itemIndex === index
                ? { ...item, label, alt: `${title} — ${label.trim() || `Image ${index + 1}`}` }
                : item,
            ))}
            onRemove={() => {
              onChange(images.filter((_, itemIndex) => itemIndex !== index));
              setAnnouncement(`${image.label || `Image ${index + 1}`} removed.`);
            }}
          />
        ))}
      </ol>
      <p className="sr-only" role="status">{announcement}</p>
    </>
  );
}

function GalleryImage({
  image,
  index,
  total,
  dragging,
  dropTarget,
  onDragStart,
  onDrag,
  onDragEnd,
  onMove,
  onRename,
  onRemove,
}: {
  image: ProjectGalleryItem;
  index: number;
  total: number;
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: () => void;
  onDrag: (point: PanInfo["point"]) => void;
  onDragEnd: (point: PanInfo["point"]) => void;
  onMove: (offset: number) => void;
  onRename: (label: string) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const nameId = useId();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  return (
    <motion.li
      drag
      style={{ x, y }}
      dragListener={false}
      dragControls={controls}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDrag={(_, info) => onDrag(info.point)}
      onDragEnd={(_, info) => {
        // Clear the drag transform before moving to the new grid position so
        // the same handle can be grabbed again immediately after dropping.
        x.jump(0);
        y.jump(0);
        onDragEnd(info.point);
      }}
      className={`owner-gallery-item${dragging ? " is-dragging" : ""}${dropTarget ? " is-drop-target" : ""}`}
    >
      <div className="owner-gallery-top">
        <span className="owner-gallery-position">{String(index + 1).padStart(2, "0")}</span>
        <button
          type="button"
          className="icon-button owner-gallery-drag"
          aria-label={`Drag to reorder image ${index + 1}`}
          title="Drag to reorder; use the arrow buttons with a keyboard"
          onPointerDown={(event) => controls.start(event)}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
      </div>
      <img src={resolveMediaUrl(image.src)} alt={image.alt} draggable={false} />
      <div className="form-field">
        <label htmlFor={nameId}>Image {index + 1} name</label>
        <input
          id={nameId}
          type="text"
          value={image.label || ""}
          placeholder={`Image ${index + 1}`}
          onChange={(event) => onRename(event.target.value)}
        />
      </div>
      <div className="owner-gallery-actions">
        <div className="owner-inline-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={`Move image ${index + 1} earlier`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`Move image ${index + 1} later`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={14} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className="icon-button owner-delete-btn"
          aria-label={`Remove slide ${index + 1}`}
          onClick={onRemove}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </motion.li>
  );
}
