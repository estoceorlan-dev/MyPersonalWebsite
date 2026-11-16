import type { ReactNode } from "react";
import { ChevronRight, FileText, Save } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "../components/Modal";
import { resolveMediaUrl } from "../context/PortfolioContext";

export type ActiveOwnerEditor = {
  id: string;
  mode: "create" | "edit";
};

export type OwnerEditorControls = {
  activeEditor: ActiveOwnerEditor | null;
  onOpen: (id: string, mode?: ActiveOwnerEditor["mode"]) => void;
  onClose: () => void;
  onSave: () => void;
  busy: boolean;
  statusMessage: { type: "success" | "error"; text: string } | null;
};

export default function OwnerEditor({
  id,
  title,
  summary,
  createTitle,
  icon: Icon = FileText,
  image,
  variant = "card",
  publishable = true,
  activeEditor,
  onOpen,
  onClose,
  onSave,
  busy,
  statusMessage,
  children,
}: OwnerEditorControls & {
  id: string;
  title: string;
  summary: string;
  createTitle?: string;
  icon?: LucideIcon;
  image?: string;
  variant?: "card" | "row";
  publishable?: boolean;
  children: ReactNode;
}) {
  const open = activeEditor?.id === id;
  const modalTitle = activeEditor?.mode === "create"
    ? createTitle || `Add ${title}`
    : `Edit ${title}`;

  return (
    <div className={variant === "card" ? "owner-card owner-editor-card" : "owner-editor-row"}>
      <button
        type="button"
        className="owner-editor-trigger"
        aria-label={`Edit ${title}`}
        aria-haspopup="dialog"
        onClick={() => onOpen(id)}
      >
        <span className="owner-editor-icon" aria-hidden="true">
          {image ? <img src={resolveMediaUrl(image)} alt="" loading="lazy" /> : <Icon size={22} />}
        </span>
        <span className="owner-editor-summary">
          <strong>{title}</strong>
          <span>{summary || "Tap to edit details"}</span>
        </span>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
      {open && (
        <Modal open onClose={onClose} title={modalTitle} className="owner-project-modal owner-content-modal">
          <div className="owner-project-editor">
            {statusMessage && publishable && (
              <div className={`owner-alert owner-alert-${statusMessage.type}`} role="status">
                {statusMessage.text}
              </div>
            )}
            {children}
          </div>
          <div className="owner-project-modal-footer">
            <p className="muted">
              {publishable
                ? "Edits stay in your draft. Save changes to publish."
                : "Use Update login credentials to save account changes."}
            </p>
            <div className="owner-inline-actions">
              <button type="button" className="button button-secondary" onClick={onClose}>
                Done
              </button>
              {publishable && (
                <button type="button" className="button button-primary" disabled={busy} onClick={onSave}>
                  <Save size={15} /> Save changes
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
