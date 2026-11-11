import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProjectGalleryItem } from "../data/projects";

const AUTO_ADVANCE_MS = 3500;

export default function ProjectCarousel({
  images,
  title,
}: {
  images: ProjectGalleryItem[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [portraitBySrc, setPortraitBySrc] = useState<Record<string, boolean>>(
    {},
  );
  const total = images.length;
  const safeIndex = activeIndex < total ? activeIndex : 0;
  const current = images[safeIndex];
  const isCurrentPortrait = Boolean(current && portraitBySrc[current.src]);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [safeIndex, total, paused]);

  if (!total) return null;

  const showPrevious = () =>
    setActiveIndex((prev) => (prev - 1 + total) % total);
  const showNext = () => setActiveIndex((prev) => (prev + 1) % total);

  return (
    <div
      className="project-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${title} interface screenshots`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showPrevious();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          showNext();
        }
      }}
    >
      <div
        className={`carousel-stage ${isCurrentPortrait ? "is-portrait" : ""}`}
      >
        {images.map((item, idx) => {
          const isActive = idx === safeIndex;
          const isPortrait = Boolean(portraitBySrc[item.src]);
          return (
            <div
              key={item.src}
              className={`carousel-slide ${isActive ? "is-active" : ""} ${isPortrait ? "is-portrait" : ""}`}
              aria-hidden={!isActive}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading={idx === 0 ? "eager" : "lazy"}
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget;
                  if (naturalWidth > 0 && naturalHeight > 0) {
                    const portrait = naturalHeight > naturalWidth;
                    setPortraitBySrc((prev) =>
                      prev[item.src] === portrait
                        ? prev
                        : { ...prev, [item.src]: portrait },
                    );
                  }
                }}
              />
            </div>
          );
        })}
        {total > 1 && (
          <>
            <button
              type="button"
              className="carousel-nav carousel-prev"
              onClick={showPrevious}
              aria-label="Previous screenshot"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="carousel-nav carousel-next"
              onClick={showNext}
              aria-label="Next screenshot"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <div className="carousel-bar">
        <div className="carousel-caption" aria-live="polite">
          <span className="carousel-count">
            {String(safeIndex + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
          <span className="carousel-label">
            {current.label || `${title} preview ${safeIndex + 1}`}
          </span>
        </div>
        {total > 1 && (
          <div
            className="carousel-dots"
            role="group"
            aria-label="Choose screenshot"
          >
            {images.map((item, idx) => {
              const isActive = idx === safeIndex;
              return (
                <button
                  key={item.src}
                  type="button"
                  className={`carousel-dot ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Show ${item.label || `screenshot ${idx + 1}`}`}
                  aria-current={isActive ? "true" : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
