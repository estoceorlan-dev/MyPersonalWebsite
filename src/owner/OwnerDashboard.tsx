import { useEffect, useState } from "react";
import { CertificateFilePreview } from "../components/CertificateFilePreview";
import type { ChangeEvent, FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  Check,
  Code2,
  ExternalLink,
  FileText,
  FolderGit2,
  Image as ImageIcon,
  Lock,
  LogOut,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import {
  usePortfolio,
  getApiUrl,
  resolveMediaUrl,
} from "../context/PortfolioContext";
import type { PortfolioContent } from "../context/PortfolioContext";
import { projectCategories } from "../data/projects";
import type { Project, ProjectCategory } from "../data/projects";
import type { SkillGroup } from "../data/skills";
import type { TimelineEntry } from "../data/experience";
import type { Achievement, Certification } from "../data/certifications";
import { ThemeToggle } from "../components/ThemeToggle";
import { Modal } from "../components/Modal";
import { navigateTo } from "../utils/router";
import AnalyticsPanel from "./AnalyticsPanel";
import ProjectOrderList from "./ProjectOrderList";
import ProjectGalleryEditor from "./ProjectGalleryEditor";
import OwnerEditor from "./OwnerEditor";
import type { ActiveOwnerEditor, OwnerEditorControls } from "./OwnerEditor";
import { OWNER_EMAIL_KEY, OWNER_TOKEN_KEY } from "./OwnerLogin";
import portraitDefault from "../../assets/images/Portrait.jpg";

type DashboardTab =
  | "analytics"
  | "profile"
  | "about"
  | "skills"
  | "projects"
  | "experience"
  | "credentials"
  | "contact";

const TABS: { id: DashboardTab; number: string; label: string; icon: typeof BarChart3 }[] = [
  { id: "analytics", number: "00", label: "Visitor Analytics", icon: BarChart3 },
  { id: "profile", number: "01", label: "Profile, Hero & Resume", icon: UserCheck },
  { id: "about", number: "02", label: "About & Occupation", icon: Sparkles },
  { id: "skills", number: "03", label: "Skills & Toolkit", icon: Code2 },
  { id: "projects", number: "04", label: "Projects", icon: FolderGit2 },
  { id: "experience", number: "05", label: "Experience & Education", icon: BriefcaseBusiness },
  { id: "credentials", number: "06", label: "Credentials & Certs", icon: Award },
  { id: "contact", number: "07", label: "Contact & Security", icon: Mail },
];

const SELECTABLE_CATEGORIES = projectCategories.filter(
  (c): c is Exclude<ProjectCategory, "All projects"> => c !== "All projects",
);

const SKILL_ICON_OPTIONS: SkillGroup["icon"][] = [
  "code",
  "layout",
  "mobile",
  "server",
  "database",
  "tools",
];

const COVER_ICONS = [
  "store",
  "flower",
  "search",
  "receipt",
  "utensils",
  "scissors",
  "guitar",
  "droplets",
  "brain",
] as const;

const COVER_TONES = ["lavender", "sage", "blue", "sand", "rose"] as const;

export default function OwnerDashboard({
  token,
  ownerEmail,
  onLogout,
  onTokenRefreshed,
}: {
  token: string;
  ownerEmail: string;
  onLogout: () => void;
  onTokenRefreshed: (nextToken: string, nextEmail: string) => void;
}) {
  const {
    content,
    savePortfolio,
    resetPortfolio,
    uploadMedia,
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState<DashboardTab>("analytics");
  const [draft, setDraft] = useState<PortfolioContent>(() =>
    structuredClone(content),
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [projectEditorOpen, setProjectEditorOpen] = useState(false);
  const [projectEditorMode, setProjectEditorMode] = useState<"create" | "edit">(
    "edit",
  );
  const [projectOrderMessage, setProjectOrderMessage] = useState("");
  const [activeEditor, setActiveEditor] = useState<ActiveOwnerEditor | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "save" | "restore" | "view-portfolio" | "logout" | null
  >(null);

  // Account credentials state
  const [securityEmail, setSecurityEmail] = useState(ownerEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setDraft(structuredClone(content));
    }
  }, [content, dirty]);

  useEffect(() => {
    setSecurityEmail(ownerEmail);
  }, [ownerEmail]);

  function updateDraft(updater: (prev: PortfolioContent) => PortfolioContent) {
    setDraft((prev) => updater(structuredClone(prev)));
    setDirty(true);
    setStatusMessage(null);
  }

  function openEditor(id: string, mode: ActiveOwnerEditor["mode"] = "edit") {
    setActiveEditor({ id, mode });
    setStatusMessage(null);
  }

  function closeEditor() {
    setActiveEditor(null);
  }

  const editorControls: OwnerEditorControls = {
    activeEditor,
    onOpen: openEditor,
    onClose: closeEditor,
    onSave: () => {
      closeEditor();
      setConfirmAction("save");
    },
    busy: saving || uploadingField !== null,
    statusMessage,
  };

  async function handleSaveAll() {
    setSaving(true);
    setStatusMessage(null);
    try {
      const saved = await savePortfolio(
        {
          ...draft,
          projects: draft.projects.map((project) => ({
            ...project,
            additionalRepositories: project.additionalRepositories
              ?.filter((repository) => repository.url.trim())
              .map((repository, index) => ({
                label: repository.label.trim() || `View repository ${index + 2}`,
                url: repository.url.trim(),
              })),
          })),
        },
        token,
      );
      setDraft(structuredClone(saved));
      setDirty(false);
      setStatusMessage({
        type: "success",
        text: "All portfolio changes have been saved and published live.",
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not save portfolio changes.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDefaults() {
    setSaving(true);
    setStatusMessage(null);
    try {
      const restored = await resetPortfolio(token);
      setDraft(structuredClone(restored));
      setDirty(false);
      setStatusMessage({
        type: "success",
        text: "Portfolio content has been restored to baseline defaults.",
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to reset portfolio content.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(
    event: ChangeEvent<HTMLInputElement>,
    fieldKey: string,
    onUploaded: (url: string, filename: string) => void,
    attachment = false,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingField(fieldKey);
    setStatusMessage(null);
    try {
      const uploaded = await uploadMedia(file, token, attachment);
      onUploaded(uploaded.url, uploaded.filename);
      setStatusMessage({
        type: "success",
        text: `Uploaded "${uploaded.filename}". Click "Save changes" to publish.`,
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "File upload failed.",
      });
    } finally {
      setUploadingField(null);
    }
  }

  async function handleUpdateCredentials(event: FormEvent) {
    event.preventDefault();
    setSecurityMessage(null);
    if (!currentPassword) {
      setSecurityMessage({
        type: "error",
        text: "Please enter your current password to confirm changes.",
      });
      return;
    }
    setUpdatingSecurity(true);
    try {
      const response = await fetch(getApiUrl("/api/auth/credentials"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          email: securityEmail.trim(),
          newPassword: newPassword || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSecurityMessage({
          type: "error",
          text: payload.error || "Could not update owner credentials.",
        });
        return;
      }
      if (payload.token && payload.owner?.email) {
        try {
          localStorage.setItem(OWNER_TOKEN_KEY, payload.token);
          localStorage.setItem(OWNER_EMAIL_KEY, payload.owner.email);
        } catch {
          // Ignore storage errors
        }
        onTokenRefreshed(payload.token, payload.owner.email);
      }
      setCurrentPassword("");
      setNewPassword("");
      setSecurityMessage({
        type: "success",
        text: "Owner login credentials updated.",
      });
    } catch {
      setSecurityMessage({
        type: "error",
        text: "Network error while updating credentials.",
      });
    } finally {
      setUpdatingSecurity(false);
    }
  }

  const currentProject: Project | undefined =
    draft.projects[activeProjectIndex] ?? draft.projects[0];

  function reorderProjects(ids: string[]) {
    const selectedId = currentProject?.id;
    const selectedIndex = ids.indexOf(selectedId ?? "");
    updateDraft((d) => {
      const byId = new Map(d.projects.map((project) => [project.id, project]));
      d.projects = ids.map((id) => byId.get(id)!);
      return d;
    });
    setActiveProjectIndex(Math.max(0, selectedIndex));
    setProjectOrderMessage("Project order updated. Save changes to publish.");
  }

  function moveCurrentProject(offset: number) {
    const ids = draft.projects.map((project) => project.id);
    const [id] = ids.splice(activeProjectIndex, 1);
    ids.splice(activeProjectIndex + offset, 0, id!);
    reorderProjects(ids);
  }

  return (
    <div className="owner-shell">
      <header className="site-header owner-header">
        <div className="container nav-inner">
          <div className="owner-brand-group">
            <a
              className="brand"
              href="/"
              onClick={(event) => {
                event.preventDefault();
                setConfirmAction("view-portfolio");
              }}
            >
              <span className="monogram">
                {draft.personal.monogram}
                <span>.</span>
              </span>
              <span className="brand-caption">
                Hello
                <br />
                Orlan
              </span>
            </a>
          </div>

          <div className="nav-actions">
            <ThemeToggle />
            <a
              href="/"
              className="button button-secondary"
              onClick={(event) => {
                event.preventDefault();
                setConfirmAction("view-portfolio");
              }}
            >
              <span>View Portfolio</span>
              <ExternalLink size={14} />
            </a>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setConfirmAction("save")}
              disabled={saving}
            >
              <Save size={15} />
              <span>
                {saving
                  ? "Saving…"
                  : dirty
                    ? "Save changes *"
                    : "Save changes"}
              </span>
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => setConfirmAction("logout")}
              aria-label="Sign out of owner dashboard"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="container owner-dashboard-main" tabIndex={-1}>
        <div className="owner-intro-bar">
          <div>
            <p className="eyebrow">
              <span>CMS</span> Signed in as {ownerEmail}
            </p>
            <h1>Portfolio Management</h1>
          </div>
          <div className="owner-intro-actions">
            {dirty && (
              <span className="owner-unsaved-pill">Unsaved edits ready</span>
            )}
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setConfirmAction("restore")}
              disabled={saving}
            >
              <RotateCcw size={14} />
              <span>Restore defaults</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`owner-alert ${statusMessage.type === "error" ? "owner-alert-error" : "owner-alert-success"}`}
            role="status"
          >
            {statusMessage.type === "success" && <Check size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="owner-workspace">
          {/* Section Navigation Tabs */}
          <nav
            className="owner-tabs"
            aria-label="Portfolio management sections"
          >
            {TABS.map(({ id, number, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`owner-tab-btn ${activeTab === id ? "is-active" : ""}`}
                aria-current={activeTab === id ? "page" : undefined}
                onClick={() => setActiveTab(id)}
              >
                <span className="owner-tab-num">{number}</span>
                <Icon size={16} />
                <span className="owner-tab-label">{label}</span>
              </button>
            ))}
          </nav>

          {/* Active Section Editor */}
          <section
            className="owner-panel"
            aria-label={
              TABS.find((t) => t.id === activeTab)?.label || "Editor"
            }
          >
            {/* 00: VISITOR ANALYTICS */}
            {activeTab === "analytics" && <AnalyticsPanel token={token} />}

            {/* 01: PROFILE, HERO & RESUME */}
            {activeTab === "profile" && (
              <div className="owner-stack">
                <OwnerEditor
                  {...editorControls}
                  id="profile-identity"
                  title="Header, Tagline & Occupation"
                  summary={`${draft.personal.name} · ${draft.personal.role}`}
                  icon={UserCheck}
                >
                  <p className="eyebrow">01 · Identity, Status & Occupation</p>
                  <h3>Header, Tagline & Occupation</h3>
                  <div className="form-grid mt-4">
                    <div className="form-field">
                      <label htmlFor="personal-name">Full Name</label>
                      <input
                        id="personal-name"
                        type="text"
                        value={draft.personal.name}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.name = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-monogram">Brand Monogram</label>
                      <input
                        id="personal-monogram"
                        type="text"
                        maxLength={4}
                        value={draft.personal.monogram}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.monogram = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-role">
                        Current Occupation / Role
                      </label>
                      <input
                        id="personal-role"
                        type="text"
                        value={draft.personal.role}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.role = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-aspiration">
                        Aspiration / Subtitle Role
                      </label>
                      <input
                        id="personal-aspiration"
                        type="text"
                        value={draft.personal.aspiration}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.aspiration = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-availability">
                        Availability Status Badge
                      </label>
                      <input
                        id="personal-availability"
                        type="text"
                        value={draft.personal.availability}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.availability = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-greeting">Hero Greeting</label>
                      <input
                        id="personal-greeting"
                        type="text"
                        value={draft.personal.heroGreeting}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.heroGreeting = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="personal-intro">
                        Hero Tagline / Main Headline
                      </label>
                      <input
                        id="personal-intro"
                        type="text"
                        value={draft.personal.introduction}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.introduction = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="personal-summary">Hero Summary</label>
                      <textarea
                        id="personal-summary"
                        rows={4}
                        value={draft.personal.summary}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.summary = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="hero-badge-title">
                        Floating Card Title
                      </label>
                      <input
                        id="hero-badge-title"
                        type="text"
                        value={draft.personal.heroBadgeTitle}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.heroBadgeTitle = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="hero-badge-subtitle">
                        Floating Card Subtitle
                      </label>
                      <input
                        id="hero-badge-subtitle"
                        type="text"
                        value={draft.personal.heroBadgeSubtitle}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.heroBadgeSubtitle = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="hero-bottom-link">
                        Hero Bottom Scroll Label
                      </label>
                      <input
                        id="hero-bottom-link"
                        type="text"
                        value={draft.personal.heroBottomLinkText}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.heroBottomLinkText = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="hero-bottom-tagline">
                        Hero Bottom Motto
                      </label>
                      <input
                        id="hero-bottom-tagline"
                        type="text"
                        value={draft.personal.heroBottomTagline}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.heroBottomTagline = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                  </div>
                </OwnerEditor>

                {/* Profile Image & Resume Upload Cards */}
                <div className="owner-split-grid">
                  <OwnerEditor
                    {...editorControls}
                    id="profile-portrait"
                    title="Hero Portrait"
                    summary={draft.personal.portraitCaption}
                    image={draft.personal.portraitUrl || portraitDefault}
                    icon={ImageIcon}
                  >
                    <p className="eyebrow">
                      <ImageIcon size={13} /> Profile Image
                    </p>
                    <h3>Hero Portrait</h3>
                    <div className="owner-portrait-preview-row">
                      <img
                        src={
                          draft.personal.portraitUrl
                            ? resolveMediaUrl(draft.personal.portraitUrl)
                            : portraitDefault
                        }
                        alt={draft.personal.portraitAlt}
                        className="owner-portrait-thumb"
                      />
                      <div className="owner-upload-controls">
                        <label
                          htmlFor="upload-portrait-input"
                          className="button button-secondary"
                        >
                          <Upload size={15} />
                          <span>
                            {uploadingField === "portrait"
                              ? "Uploading…"
                              : "Upload new portrait"}
                          </span>
                        </label>
                        <input
                          id="upload-portrait-input"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) =>
                            void handleFileUpload(e, "portrait", (url) => {
                              updateDraft((d) => {
                                d.personal.portraitUrl = url;
                                return d;
                              });
                            })
                          }
                        />
                        {draft.personal.portraitUrl && (
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() =>
                              updateDraft((d) => {
                                d.personal.portraitUrl = "";
                                return d;
                              })
                            }
                          >
                            Use original portrait
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="form-grid mt-4">
                      <div className="form-field field-wide">
                        <label htmlFor="portrait-caption">
                          Portrait Frame Caption
                        </label>
                        <input
                          id="portrait-caption"
                          type="text"
                          value={draft.personal.portraitCaption}
                          onChange={(e) =>
                            updateDraft((d) => {
                              d.personal.portraitCaption = e.target.value;
                              return d;
                            })
                          }
                        />
                      </div>
                      <div className="form-field field-wide">
                        <label htmlFor="portrait-alt">Portrait Alt Text</label>
                        <input
                          id="portrait-alt"
                          type="text"
                          value={draft.personal.portraitAlt}
                          onChange={(e) =>
                            updateDraft((d) => {
                              d.personal.portraitAlt = e.target.value;
                              return d;
                            })
                          }
                        />
                      </div>
                    </div>
                  </OwnerEditor>

                  <OwnerEditor
                    {...editorControls}
                    id="profile-resume"
                    title="Downloadable Resume (PDF)"
                    summary={draft.personal.resumeUrl}
                    icon={FileText}
                  >
                    <p className="eyebrow">
                      <FileText size={13} /> Resume Document
                    </p>
                    <h3>Downloadable Resume (PDF)</h3>
                    <p className="muted">
                      Upload an updated PDF resume to Neon persistent storage or
                      specify a path/URL.
                    </p>
                    <div className="owner-upload-controls mt-4">
                      <label
                        htmlFor="upload-resume-input"
                        className="button button-primary"
                      >
                        <Upload size={15} />
                        <span>
                          {uploadingField === "resume"
                            ? "Uploading PDF…"
                            : "Upload new Resume PDF"}
                        </span>
                      </label>
                      <input
                        id="upload-resume-input"
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        onChange={(e) =>
                          void handleFileUpload(e, "resume", (url) => {
                            updateDraft((d) => {
                              d.personal.resumeUrl = url;
                              return d;
                            });
                          })
                        }
                      />
                      {draft.personal.resumeUrl && (
                        <a
                          href={resolveMediaUrl(draft.personal.resumeUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button-secondary"
                        >
                          <span>Preview current PDF</span>
                          <ArrowUpRight size={15} />
                        </a>
                      )}
                    </div>
                    <div className="form-field field-wide mt-4">
                      <label htmlFor="resume-url-input">
                        Active Resume Path / URL
                      </label>
                      <input
                        id="resume-url-input"
                        type="text"
                        value={draft.personal.resumeUrl}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.resumeUrl = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                  </OwnerEditor>
                </div>
              </div>
            )}

            {/* 02: ABOUT & OCCUPATION */}
            {activeTab === "about" && (
              <div className="owner-stack">
                <OwnerEditor
                  {...editorControls}
                  id="about-heading"
                  title="About Section & Occupation"
                  summary={draft.sectionHeadings.about.title}
                  icon={Sparkles}
                >
                  <p className="eyebrow">02 · About Section & Status Card</p>
                  <h3>Section Heading & Occupation Card</h3>
                  <div className="form-grid mt-4">
                    <div className="form-field">
                      <label htmlFor="about-heading-label">Eyebrow Label</label>
                      <input
                        id="about-heading-label"
                        type="text"
                        value={draft.sectionHeadings.about.label}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.about.label = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="about-heading-title">Section Title</label>
                      <input
                        id="about-heading-title"
                        type="text"
                        value={draft.sectionHeadings.about.title}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.about.title = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="about-lead-1">Lead Line 1</label>
                      <input
                        id="about-lead-1"
                        type="text"
                        value={draft.personal.aboutLeadLine1}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.aboutLeadLine1 = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="about-lead-2">
                        Lead Line 2 (before highlight)
                      </label>
                      <input
                        id="about-lead-2"
                        type="text"
                        value={draft.personal.aboutLeadLine2}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.aboutLeadLine2 = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="about-lead-highlight">
                        Lead Highlight Word
                      </label>
                      <input
                        id="about-lead-highlight"
                        type="text"
                        value={draft.personal.aboutLeadHighlight}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.aboutLeadHighlight = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="edu-card-header">
                        Occupation / Education Card Header
                      </label>
                      <input
                        id="edu-card-header"
                        type="text"
                        value={draft.personal.educationCardHeader}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.educationCardHeader = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-degree">
                        Degree / Primary Role Title
                      </label>
                      <input
                        id="personal-degree"
                        type="text"
                        value={draft.personal.degree}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.degree = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-school">
                        Institution / Organization
                      </label>
                      <input
                        id="personal-school"
                        type="text"
                        value={draft.personal.school}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.school = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-acad-year">
                        Academic Year / Timeframe
                      </label>
                      <input
                        id="personal-acad-year"
                        type="text"
                        value={draft.personal.academicYear}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.academicYear = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="personal-status-pill">
                        Status Pill (e.g. Student, Developer)
                      </label>
                      <input
                        id="personal-status-pill"
                        type="text"
                        value={draft.personal.occupationStatusPill}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.occupationStatusPill = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                  </div>
                </OwnerEditor>

                {/* Biography Paragraphs */}
                <div className="owner-card">
                  <div className="owner-card-header-row">
                    <div>
                      <p className="eyebrow">Biography</p>
                      <h3>About Me Paragraphs</h3>
                    </div>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        updateDraft((d) => {
                          d.personal.about.push("New biography paragraph.");
                          return d;
                        });
                        openEditor(`paragraph-${draft.personal.about.length}`, "create");
                      }}
                    >
                      <Plus size={15} /> Add paragraph
                    </button>
                  </div>
                  <div className="owner-list-stack mt-4">
                    {draft.personal.about.map((para, idx) => (
                      <OwnerEditor
                        {...editorControls}
                        key={idx}
                        id={`paragraph-${idx}`}
                        title={`Biography paragraph ${idx + 1}`}
                        summary={para}
                        createTitle="Add paragraph"
                        variant="row"
                        icon={FileText}
                      >
                        <div className="form-field field-wide">
                          <label htmlFor={`about-para-${idx}`}>
                            Paragraph {idx + 1}
                          </label>
                          <textarea
                            id={`about-para-${idx}`}
                            rows={3}
                            value={para}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.personal.about[idx] = e.target.value;
                                return d;
                              })
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="icon-button owner-delete-btn"
                          aria-label={`Remove paragraph ${idx + 1}`}
                          onClick={() => {
                            updateDraft((d) => {
                              d.personal.about.splice(idx, 1);
                              return d;
                            });
                            closeEditor();
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </OwnerEditor>
                    ))}
                  </div>
                </div>

                {/* Core Values & Languages */}
                <div className="owner-card">
                  <div className="owner-card-header-row">
                    <div>
                      <p className="eyebrow">Values & Languages</p>
                      <h3>Focus Areas & Spoken Languages</h3>
                    </div>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        updateDraft((d) => {
                          d.personal.interests.push({
                            title: "New focus area",
                            description: "Description of this focus area.",
                          });
                          return d;
                        });
                        openEditor(`focus-${draft.personal.interests.length}`, "create");
                      }}
                    >
                      <Plus size={15} /> Add focus item
                    </button>
                  </div>
                  <div className="owner-list-stack mt-4">
                    {draft.personal.interests.map((item, idx) => (
                      <OwnerEditor
                        {...editorControls}
                        key={idx}
                        id={`focus-${idx}`}
                        title={item.title}
                        summary={item.description}
                        createTitle="Add focus item"
                        variant="row"
                        icon={Sparkles}
                      >
                        <div className="form-grid">
                          <div className="form-field">
                            <label htmlFor={`interest-title-${idx}`}>
                              Focus Title {idx + 1}
                            </label>
                            <input
                              id={`interest-title-${idx}`}
                              type="text"
                              value={item.title}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.personal.interests[idx]!.title =
                                    e.target.value;
                                  return d;
                                })
                              }
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`interest-desc-${idx}`}>
                              Description
                            </label>
                            <input
                              id={`interest-desc-${idx}`}
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.personal.interests[idx]!.description =
                                    e.target.value;
                                  return d;
                                })
                              }
                            />
                          </div>
                        </div>
                        {draft.personal.interests.length > 1 && (
                          <button
                            type="button"
                            className="button button-secondary mt-3"
                            onClick={() => {
                              updateDraft((d) => {
                                d.personal.interests.splice(idx, 1);
                                return d;
                              });
                              closeEditor();
                            }}
                          >
                            <Trash2 size={14} /> Remove item
                          </button>
                        )}
                      </OwnerEditor>
                    ))}
                  </div>

                  <OwnerEditor
                    {...editorControls}
                    id="about-languages"
                    title="Spoken Languages"
                    summary={draft.personal.languages.join(", ")}
                    variant="row"
                    icon={Mail}
                  >
                  <div className="form-field field-wide mt-4">
                    <label htmlFor="personal-languages">
                      Languages (comma-separated)
                    </label>
                    <input
                      id="personal-languages"
                      type="text"
                      value={draft.personal.languages.join(", ")}
                      onChange={(e) =>
                        updateDraft((d) => {
                          d.personal.languages = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          return d;
                        })
                      }
                    />
                  </div>
                  </OwnerEditor>
                </div>
              </div>
            )}

            {/* 03: SKILLS & TOOLKIT */}
            {activeTab === "skills" && (
              <div className="owner-stack">
                <OwnerEditor
                  {...editorControls}
                  id="skills-heading"
                  title="Skills Section Heading"
                  summary={draft.sectionHeadings.skills.title}
                  icon={Code2}
                >
                  <p className="eyebrow">03 · Technical Skills</p>
                  <h3>Section Heading</h3>
                  <div className="form-grid mt-4">
                    <div className="form-field">
                      <label htmlFor="skills-label">Eyebrow Label</label>
                      <input
                        id="skills-label"
                        type="text"
                        value={draft.sectionHeadings.skills.label}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.skills.label = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="skills-title">Section Title</label>
                      <input
                        id="skills-title"
                        type="text"
                        value={draft.sectionHeadings.skills.title}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.skills.title = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="skills-desc">Section Description</label>
                      <textarea
                        id="skills-desc"
                        rows={2}
                        value={draft.sectionHeadings.skills.description || ""}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.skills.description =
                              e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                  </div>
                </OwnerEditor>

                <div className="owner-card">
                  <div className="owner-card-header-row">
                    <div>
                      <p className="eyebrow">Skill Categories</p>
                      <h3>Manage Skill Groups & Tags</h3>
                    </div>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        updateDraft((d) => {
                          d.skillGroups.push({
                            title: "New Skill Category",
                            icon: "code",
                            description: "Tools and technologies in this area.",
                            skills: ["New Skill"],
                          });
                          return d;
                        });
                        openEditor(`skill-${draft.skillGroups.length}`, "create");
                      }}
                    >
                      <Plus size={15} /> Add skill category
                    </button>
                  </div>

                  <div className="owner-list-stack mt-4">
                    {draft.skillGroups.map((group, idx) => (
                      <OwnerEditor
                        {...editorControls}
                        key={idx}
                        id={`skill-${idx}`}
                        title={group.title}
                        summary={group.skills.join(", ")}
                        createTitle="Add skill category"
                        variant="row"
                        icon={Code2}
                      >
                        <div className="owner-subcard-top">
                          <strong>
                            {idx + 1}. {group.title}
                          </strong>
                          <div className="owner-inline-actions">
                            <button
                              type="button"
                              className="icon-button"
                              disabled={idx === 0}
                              aria-label={`Move ${group.title} up`}
                              onClick={() => {
                                updateDraft((d) => {
                                  const temp = d.skillGroups[idx - 1]!;
                                  d.skillGroups[idx - 1] = d.skillGroups[idx]!;
                                  d.skillGroups[idx] = temp;
                                  return d;
                                });
                                setActiveEditor((prev) =>
                                  prev ? { ...prev, id: `skill-${idx - 1}` } : null,
                                );
                              }}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              disabled={idx === draft.skillGroups.length - 1}
                              aria-label={`Move ${group.title} down`}
                              onClick={() => {
                                updateDraft((d) => {
                                  const temp = d.skillGroups[idx + 1]!;
                                  d.skillGroups[idx + 1] = d.skillGroups[idx]!;
                                  d.skillGroups[idx] = temp;
                                  return d;
                                });
                                setActiveEditor((prev) =>
                                  prev ? { ...prev, id: `skill-${idx + 1}` } : null,
                                );
                              }}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-button owner-delete-btn"
                              aria-label={`Delete ${group.title}`}
                              onClick={() => {
                                updateDraft((d) => {
                                  d.skillGroups.splice(idx, 1);
                                  return d;
                                });
                                closeEditor();
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="form-grid mt-3">
                          <div className="form-field">
                            <label htmlFor={`skill-group-title-${idx}`}>
                              Category Title
                            </label>
                            <input
                              id={`skill-group-title-${idx}`}
                              type="text"
                              value={group.title}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.skillGroups[idx]!.title = e.target.value;
                                  return d;
                                })
                              }
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`skill-group-icon-${idx}`}>
                              Category Icon
                            </label>
                            <select
                              id={`skill-group-icon-${idx}`}
                              className="owner-select"
                              value={group.icon}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.skillGroups[idx]!.icon = e.target
                                    .value as SkillGroup["icon"];
                                  return d;
                                })
                              }
                            >
                              {SKILL_ICON_OPTIONS.map((ic) => (
                                <option key={ic} value={ic}>
                                  {ic}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field field-wide">
                            <label htmlFor={`skill-group-desc-${idx}`}>
                              Short Description
                            </label>
                            <input
                              id={`skill-group-desc-${idx}`}
                              type="text"
                              value={group.description}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.skillGroups[idx]!.description =
                                    e.target.value;
                                  return d;
                                })
                              }
                            />
                          </div>
                          <div className="form-field field-wide">
                            <label htmlFor={`skill-group-tags-${idx}`}>
                              Skills (comma-separated)
                            </label>
                            <input
                              id={`skill-group-tags-${idx}`}
                              type="text"
                              value={group.skills.join(", ")}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.skillGroups[idx]!.skills = e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  return d;
                                })
                              }
                            />
                          </div>
                        </div>
                      </OwnerEditor>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 04: PROJECTS */}
            {activeTab === "projects" && (
              <div className="owner-stack">
                <OwnerEditor
                  {...editorControls}
                  id="projects-heading"
                  title="Projects Section Heading"
                  summary={draft.sectionHeadings.projects.title}
                  icon={FolderGit2}
                >
                  <p className="eyebrow">04 · Projects Section</p>
                  <h3>Section Heading</h3>
                  <div className="form-grid mt-4">
                    <div className="form-field">
                      <label htmlFor="projects-label">Eyebrow Label</label>
                      <input
                        id="projects-label"
                        type="text"
                        value={draft.sectionHeadings.projects.label}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.projects.label = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="projects-title">Section Title</label>
                      <input
                        id="projects-title"
                        type="text"
                        value={draft.sectionHeadings.projects.title}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.projects.title = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="projects-desc">Section Description</label>
                      <textarea
                        id="projects-desc"
                        rows={2}
                        value={draft.sectionHeadings.projects.description || ""}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.projects.description =
                              e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                  </div>
                </OwnerEditor>

                <div className="owner-card">
                  <div className="owner-card-header-row">
                    <div>
                      <p className="eyebrow">
                        {draft.projects.length} Portfolio Projects
                      </p>
                      <h3>Project Library</h3>
                    </div>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        const newId = `project-${Date.now()}`;
                        updateDraft((d) => {
                          d.projects.unshift({
                            id: newId,
                            title: "New Portfolio Project",
                            category: "Web Development",
                            categories: ["Web Development"],
                            description:
                              "Describe the purpose, workflow, and impact of this project.",
                            technologies: ["React", "TypeScript", "Node.js"],
                            features: [
                              "Key workflow feature 1",
                              "Key workflow feature 2",
                            ],
                            preview: "cover",
                            cover: {
                              icon: "store",
                              tone: "lavender",
                              label: "FEATURED PROJECT",
                            },
                            repository: "",
                            demo: "",
                            year: String(new Date().getFullYear()),
                            status: "In development",
                          });
                          return d;
                        });
                        setActiveProjectIndex(0);
                        setProjectEditorMode("create");
                        setProjectEditorOpen(true);
                      }}
                    >
                      <Plus size={15} /> Add new project
                    </button>
                  </div>

                  <p id="project-order-help" className="muted mt-3">
                    Tap a project to edit. Drag the handles or use the arrows to
                    sort. The first six projects are featured.
                  </p>
                  <ProjectOrderList
                    projects={draft.projects}
                    activeProjectId={
                      projectEditorOpen ? currentProject?.id : undefined
                    }
                    onSelect={(index) => {
                      setActiveProjectIndex(index);
                      setProjectEditorMode("edit");
                      setStatusMessage(null);
                      setProjectEditorOpen(true);
                    }}
                    onReorder={reorderProjects}
                  />
                  <p className="sr-only" role="status">
                    {projectOrderMessage}
                  </p>

                  {currentProject && projectEditorOpen && (
                    <Modal
                      open={projectEditorOpen}
                      onClose={() => setProjectEditorOpen(false)}
                      title={
                        projectEditorMode === "create"
                          ? "Add new project"
                          : "Edit project"
                      }
                      className="owner-project-modal"
                    >
                    <div className="owner-project-editor">
                      <div className="owner-subcard-top">
                        <div>
                          <span className="eyebrow">
                            {projectEditorMode === "create"
                              ? "New Project"
                              : `Editing Project #${activeProjectIndex + 1}`}
                          </span>
                          <h4>{currentProject.title}</h4>
                        </div>
                        <div className="owner-inline-actions">
                          <button
                            type="button"
                            className="icon-button"
                            disabled={activeProjectIndex === 0}
                            aria-label="Move project earlier"
                            onClick={() => moveCurrentProject(-1)}
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            disabled={
                              activeProjectIndex === draft.projects.length - 1
                            }
                            aria-label="Move project later"
                            onClick={() => moveCurrentProject(1)}
                          >
                            <ArrowDown size={15} />
                          </button>
                          <button
                            type="button"
                            className="button button-secondary owner-delete-btn"
                            onClick={() => {
                              const idx = activeProjectIndex;
                              updateDraft((d) => {
                                d.projects.splice(idx, 1);
                                return d;
                              });
                              setActiveProjectIndex(Math.max(0, idx - 1));
                              setProjectEditorOpen(false);
                            }}
                          >
                            <Trash2 size={14} /> Delete project
                          </button>
                        </div>
                      </div>

                      {statusMessage && (
                        <div
                          className={`owner-alert mt-4 owner-alert-${statusMessage.type}`}
                          role="status"
                        >
                          <span>{statusMessage.text}</span>
                        </div>
                      )}
                      <div className="form-grid mt-4">
                        <div className="form-field">
                          <label htmlFor="proj-title">Project Title</label>
                          <input
                            id="proj-title"
                            type="text"
                            value={currentProject.title}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.title =
                                  e.target.value;
                                return d;
                              })
                            }
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="proj-primary-cat">
                            Primary Category
                          </label>
                          <select
                            id="proj-primary-cat"
                            className="owner-select"
                            value={currentProject.category}
                            onChange={(e) => {
                              const val = e.target.value as Exclude<
                                ProjectCategory,
                                "All projects"
                              >;
                              updateDraft((d) => {
                                const target = d.projects[activeProjectIndex]!;
                                target.category = val;
                                if (!target.categories.includes(val)) {
                                  target.categories = [
                                    val,
                                    ...target.categories,
                                  ];
                                }
                                return d;
                              });
                            }}
                          >
                            {SELECTABLE_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field field-wide">
                          <span className="owner-field-label">
                            Filter Categories
                          </span>
                          <div className="owner-checkbox-row">
                            {SELECTABLE_CATEGORIES.map((cat) => {
                              const checked =
                                currentProject.categories.includes(cat);
                              return (
                                <label
                                  key={cat}
                                  className={`owner-chip-toggle ${checked ? "is-checked" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) =>
                                      updateDraft((d) => {
                                        const target =
                                          d.projects[activeProjectIndex]!;
                                        if (e.target.checked) {
                                          if (!target.categories.includes(cat)) {
                                            target.categories.push(cat);
                                          }
                                        } else {
                                          target.categories =
                                            target.categories.filter(
                                              (c) => c !== cat,
                                            );
                                          if (target.categories.length === 0) {
                                            target.categories = [
                                              target.category,
                                            ];
                                          }
                                        }
                                        return d;
                                      })
                                    }
                                  />
                                  <span>{cat}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="form-field field-wide">
                          <label htmlFor="proj-desc">Description</label>
                          <textarea
                            id="proj-desc"
                            rows={3}
                            value={currentProject.description}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.description =
                                  e.target.value;
                                return d;
                              })
                            }
                          />
                        </div>

                        <div className="form-field field-wide">
                          <label htmlFor="proj-tech">
                            Technologies Used (comma-separated)
                          </label>
                          <input
                            id="proj-tech"
                            type="text"
                            value={currentProject.technologies.join(", ")}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.technologies =
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                return d;
                              })
                            }
                          />
                        </div>

                        <div className="form-field field-wide">
                          <label htmlFor="proj-features">
                            Key Features / What it Explores (one per line)
                          </label>
                          <textarea
                            id="proj-features"
                            rows={4}
                            value={currentProject.features.join("\n")}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.features =
                                  e.target.value
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                return d;
                              })
                            }
                          />
                        </div>

                        <div className="form-field">
                          <label htmlFor="proj-repo">Repository URL</label>
                          <input
                            id="proj-repo"
                            type="url"
                            value={currentProject.repository}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.repository =
                                  e.target.value;
                                return d;
                              })
                            }
                          />
                        </div>
                        <div className="field-wide owner-repositories">
                          <div className="owner-card-header-row">
                            <span className="owner-field-label">
                              Additional repositories
                            </span>
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() =>
                                updateDraft((d) => {
                                  const project = d.projects[activeProjectIndex]!;
                                  project.additionalRepositories ??= [];
                                  project.additionalRepositories.push({
                                    label: "",
                                    url: "",
                                  });
                                  return d;
                                })
                              }
                            >
                              <Plus size={14} /> Add another repository
                            </button>
                          </div>
                          <p className="muted">
                            Add separate frontend, backend, or related repositories.
                            Give each link a label for the project details.
                          </p>
                          {currentProject.additionalRepositories?.map((repository, index) => (
                            <div className="owner-repository-row" key={index}>
                              <div className="form-field">
                                <label htmlFor={`proj-repo-label-${index}`}>
                                  Repository {index + 2} Label
                                </label>
                                <input
                                  id={`proj-repo-label-${index}`}
                                  type="text"
                                  placeholder="Backend repository"
                                  value={repository.label}
                                  onChange={(event) =>
                                    updateDraft((d) => {
                                      const target = d.projects[activeProjectIndex]!
                                        .additionalRepositories![index]!;
                                      target.label = event.target.value;
                                      return d;
                                    })
                                  }
                                />
                              </div>
                              <div className="form-field">
                                <label htmlFor={`proj-repo-url-${index}`}>
                                  Repository {index + 2} URL
                                </label>
                                <input
                                  id={`proj-repo-url-${index}`}
                                  type="url"
                                  placeholder="https://github.com/username/backend"
                                  value={repository.url}
                                  onChange={(event) =>
                                    updateDraft((d) => {
                                      const target = d.projects[activeProjectIndex]!
                                        .additionalRepositories![index]!;
                                      target.url = event.target.value;
                                      return d;
                                    })
                                  }
                                />
                              </div>
                              <button
                                type="button"
                                className="icon-button owner-delete-btn"
                                aria-label={`Remove repository ${index + 2}`}
                                onClick={() =>
                                  updateDraft((d) => {
                                    const target = d.projects[activeProjectIndex]!;
                                    target.additionalRepositories!.splice(index, 1);
                                    return d;
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="form-field">
                          <label htmlFor="proj-demo">Live Demo URL</label>
                          <input
                            id="proj-demo"
                            type="url"
                            value={currentProject.demo}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.demo =
                                  e.target.value;
                                return d;
                              })
                            }
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="proj-demo-label">
                            Demo Button Label
                          </label>
                          <input
                            id="proj-demo-label"
                            type="text"
                            placeholder="Live demo"
                            value={currentProject.demoLabel || ""}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.demoLabel =
                                  e.target.value || undefined;
                                return d;
                              })
                            }
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="proj-year">Year</label>
                          <input
                            id="proj-year"
                            type="text"
                            value={currentProject.year || ""}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.year =
                                  e.target.value || undefined;
                                return d;
                              })
                            }
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="proj-status">Project Status</label>
                          <input
                            id="proj-status"
                            type="text"
                            placeholder="Academic project, Prototype, In development…"
                            value={currentProject.status || ""}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.status =
                                  e.target.value || undefined;
                                return d;
                              })
                            }
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="proj-cover-tone">Cover Tone</label>
                          <select
                            id="proj-cover-tone"
                            className="owner-select"
                            value={currentProject.cover?.tone || "lavender"}
                            onChange={(e) =>
                              updateDraft((d) => {
                                const target = d.projects[activeProjectIndex]!;
                                target.cover = {
                                  icon: target.cover?.icon || "store",
                                  tone: e.target
                                    .value as (typeof COVER_TONES)[number],
                                  label:
                                    target.cover?.label || "PROJECT OVERVIEW",
                                };
                                return d;
                              })
                            }
                          >
                            {COVER_TONES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-field">
                          <label htmlFor="proj-cover-icon">Cover Icon</label>
                          <select
                            id="proj-cover-icon"
                            className="owner-select"
                            value={currentProject.cover?.icon || "store"}
                            onChange={(e) =>
                              updateDraft((d) => {
                                const target = d.projects[activeProjectIndex]!;
                                target.cover = {
                                  icon: e.target
                                    .value as (typeof COVER_ICONS)[number],
                                  tone: target.cover?.tone || "lavender",
                                  label:
                                    target.cover?.label || "PROJECT OVERVIEW",
                                };
                                return d;
                              })
                            }
                          >
                            {COVER_ICONS.map((ic) => (
                              <option key={ic} value={ic}>
                                {ic}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-field">
                          <label htmlFor="proj-cover-label">
                            Cover Subtitle Label
                          </label>
                          <input
                            id="proj-cover-label"
                            type="text"
                            value={currentProject.cover?.label || ""}
                            onChange={(e) =>
                              updateDraft((d) => {
                                const target = d.projects[activeProjectIndex]!;
                                target.cover = {
                                  icon: target.cover?.icon || "store",
                                  tone: target.cover?.tone || "lavender",
                                  label: e.target.value,
                                };
                                return d;
                              })
                            }
                          />
                        </div>

                        <div className="form-field field-wide">
                          <label htmlFor="proj-role">
                            My Contribution / Role
                          </label>
                          <textarea
                            id="proj-role"
                            rows={2}
                            value={currentProject.role || ""}
                            onChange={(e) =>
                              updateDraft((d) => {
                                d.projects[activeProjectIndex]!.role =
                                  e.target.value || undefined;
                                return d;
                              })
                            }
                          />
                        </div>

                        <div className="form-field field-wide">
                          <label htmlFor="proj-notes">
                            Project Scope Notes (one per line)
                          </label>
                          <textarea
                            id="proj-notes"
                            rows={2}
                            value={(currentProject.notes || []).join("\n")}
                            onChange={(e) =>
                              updateDraft((d) => {
                                const lines = e.target.value
                                  .split("\n")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                d.projects[activeProjectIndex]!.notes =
                                  lines.length ? lines : undefined;
                                return d;
                              })
                            }
                          />
                        </div>

                        {/* Project Cover/Logo Image Upload */}
                        <div className="form-field field-wide">
                          <span className="owner-field-label">
                            Project Cover / Logo Image
                          </span>
                          <div className="owner-upload-controls">
                            <label
                              htmlFor="proj-image-upload"
                              className="button button-secondary"
                            >
                              <Upload size={14} />
                              <span>
                                {uploadingField === "proj-image"
                                  ? "Uploading…"
                                  : "Upload cover / logo image"}
                              </span>
                            </label>
                            <input
                              id="proj-image-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) =>
                                void handleFileUpload(
                                  e,
                                  "proj-image",
                                  (url) => {
                                    updateDraft((d) => {
                                      const target =
                                        d.projects[activeProjectIndex]!;
                                      target.image = url;
                                      target.imageAlt = `${target.title} logo`;
                                      return d;
                                    });
                                  },
                                )
                              }
                            />
                            {currentProject.image && (
                              <button
                                type="button"
                                className="button button-secondary"
                                onClick={() =>
                                  updateDraft((d) => {
                                    delete d.projects[activeProjectIndex]!.image;
                                    return d;
                                  })
                                }
                              >
                                Clear custom image
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Gallery Screenshots Upload */}
                        <div className="form-field field-wide">
                          <span className="owner-field-label">
                            Gallery Screenshots (
                            {currentProject.gallery?.length || 0} slides)
                          </span>
                          <div className="owner-upload-controls">
                            <label
                              htmlFor="proj-gallery-upload"
                              className="button button-secondary"
                            >
                              <Plus size={14} />
                              <span>
                                {uploadingField === "proj-gallery"
                                  ? "Uploading screenshot…"
                                  : "Add gallery screenshot"}
                              </span>
                            </label>
                            <input
                              id="proj-gallery-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) =>
                                void handleFileUpload(
                                  e,
                                  "proj-gallery",
                                  (url, filename) => {
                                    const cleanLabel =
                                      filename
                                        .replace(/\.[^.]+$/, "")
                                        .replace(/[_-]+/g, " ") || "Interface";
                                    updateDraft((d) => {
                                      const target =
                                        d.projects[activeProjectIndex]!;
                                      target.gallery = [
                                        ...(target.gallery || []),
                                        {
                                          src: url,
                                          label: cleanLabel,
                                          alt: `${target.title} — ${cleanLabel}`,
                                        },
                                      ];
                                      return d;
                                    });
                                  },
                                )
                              }
                            />
                          </div>
                          {currentProject.gallery &&
                            currentProject.gallery.length > 0 && (
                              <ProjectGalleryEditor
                                images={currentProject.gallery}
                                title={currentProject.title}
                                onChange={(images) =>
                                  updateDraft((d) => {
                                    d.projects[activeProjectIndex]!.gallery = images;
                                    return d;
                                  })
                                }
                              />
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="owner-project-modal-footer">
                      <p className="muted">Edits stay in your draft. Save changes to publish.</p>
                      <div className="owner-inline-actions">
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => setProjectEditorOpen(false)}
                        >
                          Done
                        </button>
                        <button
                          type="button"
                          className="button button-primary"
                          disabled={saving || uploadingField !== null}
                          onClick={() => {
                            setProjectEditorOpen(false);
                            setConfirmAction("save");
                          }}
                        >
                          <Save size={15} /> Save changes
                        </button>
                      </div>
                    </div>
                    </Modal>
                  )}
                </div>
              </div>
            )}

            {/* 05: EXPERIENCE & EDUCATION */}
            {activeTab === "experience" && (
              <div className="owner-stack">
                <OwnerEditor
                  {...editorControls}
                  id="experience-heading"
                  title="Experience Section & Callout"
                  summary={draft.sectionHeadings.experience.title}
                  icon={BriefcaseBusiness}
                >
                  <p className="eyebrow">05 · Experience & Education</p>
                  <h3>Section Heading & Callout Banner</h3>
                  <div className="form-grid mt-4">
                    <div className="form-field">
                      <label htmlFor="exp-label">Eyebrow Label</label>
                      <input
                        id="exp-label"
                        type="text"
                        value={draft.sectionHeadings.experience.label}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.experience.label = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="exp-title">Section Title</label>
                      <input
                        id="exp-title"
                        type="text"
                        value={draft.sectionHeadings.experience.title}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.experience.title = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="exp-desc">Section Description</label>
                      <textarea
                        id="exp-desc"
                        rows={2}
                        value={
                          draft.sectionHeadings.experience.description || ""
                        }
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.experience.description =
                              e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="exp-callout-title">
                        Bottom Banner Headline
                      </label>
                      <input
                        id="exp-callout-title"
                        type="text"
                        value={draft.personal.experienceCalloutTitle}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.experienceCalloutTitle = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="exp-callout-sub">
                        Bottom Banner Subtitle
                      </label>
                      <input
                        id="exp-callout-sub"
                        type="text"
                        value={draft.personal.experienceCalloutSubtitle}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.experienceCalloutSubtitle =
                              e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                  </div>
                </OwnerEditor>

                {/* Education Entries */}
                <div className="owner-card">
                  <div className="owner-card-header-row">
                    <div>
                      <p className="eyebrow">Academic Timeline</p>
                      <h3>Education Entries</h3>
                    </div>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        updateDraft((d) => {
                          d.education.push({
                            title: "Degree or Program",
                            organization: "School / Institution",
                            date: "2026–2027",
                            kind: "education",
                            description: "Summary of studies and focus areas.",
                            highlights: ["Key academic focus or milestone."],
                          });
                          return d;
                        });
                        openEditor(`edu-${draft.education.length}`, "create");
                      }}
                    >
                      <Plus size={15} /> Add education entry
                    </button>
                  </div>
                  <div className="owner-list-stack mt-4">
                    {draft.education.map((entry, idx) => (
                      <OwnerEditor
                        {...editorControls}
                        key={`edu-${idx}`}
                        id={`edu-${idx}`}
                        title={entry.title}
                        summary={`${entry.organization} · ${entry.date}`}
                        createTitle="Add education entry"
                        variant="row"
                        icon={BriefcaseBusiness}
                      >
                      <TimelineEntryEditor
                        key={`edu-${idx}`}
                        prefix={`edu-${idx}`}
                        entry={entry}
                        onChange={(next) =>
                          updateDraft((d) => {
                            d.education[idx] = next;
                            return d;
                          })
                        }
                        onDelete={() => {
                          updateDraft((d) => {
                            d.education.splice(idx, 1);
                            return d;
                          });
                          closeEditor();
                        }}
                      />
                      </OwnerEditor>
                    ))}
                  </div>
                </div>

                {/* Work Experience Entries */}
                <div className="owner-card">
                  <div className="owner-card-header-row">
                    <div>
                      <p className="eyebrow">Work & Practical Timeline</p>
                      <h3>Experience Entries</h3>
                    </div>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        updateDraft((d) => {
                          d.experience.push({
                            title: "Role / Position Title",
                            organization: "Company · Location",
                            date: "2026",
                            kind: "work",
                            description: "Summary of responsibilities.",
                            highlights: ["Key contribution or achievement."],
                          });
                          return d;
                        });
                        openEditor(`exp-${draft.experience.length}`, "create");
                      }}
                    >
                      <Plus size={15} /> Add experience entry
                    </button>
                  </div>
                  <div className="owner-list-stack mt-4">
                    {draft.experience.map((entry, idx) => (
                      <OwnerEditor
                        {...editorControls}
                        key={`exp-${idx}`}
                        id={`exp-${idx}`}
                        title={entry.title}
                        summary={`${entry.organization} · ${entry.date}`}
                        createTitle="Add experience entry"
                        variant="row"
                        icon={BriefcaseBusiness}
                      >
                      <TimelineEntryEditor
                        key={`exp-${idx}`}
                        prefix={`exp-${idx}`}
                        entry={entry}
                        onChange={(next) =>
                          updateDraft((d) => {
                            d.experience[idx] = next;
                            return d;
                          })
                        }
                        onDelete={() => {
                          updateDraft((d) => {
                            d.experience.splice(idx, 1);
                            return d;
                          });
                          closeEditor();
                        }}
                      />
                      </OwnerEditor>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 06: CREDENTIALS & ELIGIBILITY */}
            {activeTab === "credentials" && (
              <div className="owner-stack">
                <OwnerEditor
                  {...editorControls}
                  id="credentials-heading"
                  title="Credentials Section Heading"
                  summary={draft.sectionHeadings.certifications.title}
                  icon={Award}
                >
                  <p className="eyebrow">06 · Credentials & Eligibility</p>
                  <h3>Section Heading</h3>
                  <div className="form-grid mt-4">
                    <div className="form-field">
                      <label htmlFor="certs-label">Eyebrow Label</label>
                      <input
                        id="certs-label"
                        type="text"
                        value={draft.sectionHeadings.certifications.label}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.certifications.label =
                              e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="certs-title">Section Title</label>
                      <input
                        id="certs-title"
                        type="text"
                        value={draft.sectionHeadings.certifications.title}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.certifications.title =
                              e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="certs-desc">Section Description</label>
                      <textarea
                        id="certs-desc"
                        rows={2}
                        value={
                          draft.sectionHeadings.certifications.description || ""
                        }
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.sectionHeadings.certifications.description =
                              e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                  </div>
                </OwnerEditor>

                {/* Professional Eligibility / Achievements */}
                <div className="owner-card">
                  <div className="owner-card-header-row">
                    <div>
                      <p className="eyebrow">Eligibility & Honors</p>
                      <h3>Professional Eligibility</h3>
                    </div>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        updateDraft((d) => {
                          d.achievements.push({
                            title: "New Professional Eligibility",
                            organization: "Issuing Body / Commission",
                            date: "2026",
                            description: "Eligibility details.",
                          });
                          return d;
                        });
                        openEditor(`eligibility-${draft.achievements.length}`, "create");
                      }}
                    >
                      <Plus size={15} /> Add eligibility
                    </button>
                  </div>
                  <div className="owner-list-stack mt-4">
                    {draft.achievements.map((item: Achievement, idx: number) => (
                      <OwnerEditor
                        {...editorControls}
                        key={idx}
                        id={`eligibility-${idx}`}
                        title={item.title}
                        summary={`${item.organization} · ${item.date}`}
                        createTitle="Add eligibility"
                        variant="row"
                        icon={Award}
                        image={item.image}
                        onClose={() => {
                          if (uploadingField === null) closeEditor();
                        }}
                      >
                        <div className="owner-subcard-top">
                          <strong>{item.title}</strong>
                          <button
                            type="button"
                            className="icon-button owner-delete-btn"
                            aria-label={`Delete ${item.title}`}
                            disabled={uploadingField !== null}
                            onClick={() => {
                              updateDraft((d) => {
                                d.achievements.splice(idx, 1);
                                return d;
                              });
                              closeEditor();
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="form-grid mt-3">
                          <div className="form-field">
                            <label htmlFor={`ach-title-${idx}`}>Title</label>
                            <input
                              id={`ach-title-${idx}`}
                              type="text"
                              value={item.title}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.achievements[idx]!.title = e.target.value;
                                  return d;
                                })
                              }
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`ach-org-${idx}`}>
                              Organization
                            </label>
                            <input
                              id={`ach-org-${idx}`}
                              type="text"
                              value={item.organization}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.achievements[idx]!.organization =
                                    e.target.value;
                                  return d;
                                })
                              }
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`ach-date-${idx}`}>Date</label>
                            <input
                              id={`ach-date-${idx}`}
                              type="text"
                              value={item.date}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.achievements[idx]!.date = e.target.value;
                                  return d;
                                })
                              }
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`ach-desc-${idx}`}>
                              Description
                            </label>
                            <input
                              id={`ach-desc-${idx}`}
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateDraft((d) => {
                                  d.achievements[idx]!.description =
                                    e.target.value;
                                  return d;
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="form-field mt-4">
                          <label htmlFor={`eligibility-picture-${idx}`}>Certificate picture</label>
                          {item.image && (
                            <img
                              className="eligibility-picture"
                              src={resolveMediaUrl(item.image)}
                              alt={`${item.title} certificate preview`}
                            />
                          )}
                          <input
                            id={`eligibility-picture-${idx}`}
                            type="file"
                            accept="image/*"
                            disabled={editorControls.busy}
                            onChange={(event) => {
                              const file = event.currentTarget.files?.[0];
                              if (file && !file.type.startsWith("image/")) {
                                event.currentTarget.value = "";
                                setStatusMessage({ type: "error", text: "Choose an image file for the certificate picture." });
                                return;
                              }
                              void handleFileUpload(event, `eligibility-picture-${idx}`, (url) => {
                                updateDraft((d) => {
                                  d.achievements[idx]!.image = url;
                                  return d;
                                });
                              });
                            }}
                          />
                          {uploadingField === `eligibility-picture-${idx}` && <span role="status">Uploading picture…</span>}
                          {item.image && (
                            <button
                              type="button"
                              className="button button-secondary"
                              disabled={editorControls.busy}
                              onClick={() => updateDraft((d) => {
                                delete d.achievements[idx]!.image;
                                return d;
                              })}
                            >
                              Remove picture
                            </button>
                          )}
                        </div>
                        <div className="form-field mt-4">
                          <label htmlFor={`eligibility-file-${idx}`}>Attach a PDF or other file</label>
                          <input
                            id={`eligibility-file-${idx}`}
                            type="file"
                            aria-describedby={`eligibility-file-hint-${idx}`}
                            disabled={editorControls.busy}
                            onChange={(event) => {
                              const mimeType = event.currentTarget.files?.[0]?.type;
                              void handleFileUpload(event, `eligibility-file-${idx}`, (url, filename) => {
                                updateDraft((d) => {
                                  const entry = d.achievements[idx]!;
                                  (entry.attachments ??= []).push({ url, filename, mimeType });
                                  return d;
                                });
                              }, true);
                            }}
                          />
                          <span id={`eligibility-file-hint-${idx}`} className="muted">Up to 15 MB per file.</span>
                          {uploadingField === `eligibility-file-${idx}` && <span role="status">Uploading file…</span>}
                          {item.attachments?.map((file) => (
                            <div className="owner-inline-actions" key={file.url}>
                              <CertificateFilePreview file={file} />
                              <button
                                type="button"
                                className="icon-button"
                                aria-label={`Remove ${file.filename}`}
                                disabled={editorControls.busy}
                                onClick={() => updateDraft((d) => {
                                  const entry = d.achievements[idx]!;
                                  entry.attachments = entry.attachments?.filter((attachment) => attachment.url !== file.url);
                                  return d;
                                })}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </OwnerEditor>
                    ))}
                  </div>
                </div>

                {/* Course Certifications */}
                <div className="owner-card">
                  <div className="owner-card-header-row">
                    <div>
                      <p className="eyebrow">Course Certificates</p>
                      <h3>Certifications ({draft.certifications.length})</h3>
                    </div>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        updateDraft((d) => {
                          d.certifications.unshift({
                            id: `cert-${Date.now()}`,
                            title: "New Certification",
                            issuer: "Issuing Organization",
                            date: "2026",
                            description:
                              "Completed certification course and assessment.",
                          });
                          return d;
                        });
                        openEditor("cert-0", "create");
                      }}
                    >
                      <Plus size={15} /> Add certification
                    </button>
                  </div>
                  <div className="owner-list-stack mt-4">
                    {draft.certifications.map(
                      (cert: Certification, idx: number) => (
                        <OwnerEditor
                          {...editorControls}
                          key={cert.id || idx}
                          id={`cert-${idx}`}
                          title={cert.title}
                          summary={`${cert.issuer} · ${cert.date}`}
                          createTitle="Add certification"
                          variant="row"
                          icon={Award}
                          image={cert.image}
                        >
                          <div className="owner-subcard-top">
                            <strong>
                              {idx + 1}. {cert.title}
                            </strong>
                            <button
                              type="button"
                              className="icon-button owner-delete-btn"
                              aria-label={`Delete ${cert.title}`}
                              onClick={() => {
                                updateDraft((d) => {
                                  d.certifications.splice(idx, 1);
                                  return d;
                                });
                                closeEditor();
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="form-grid mt-3">
                            <div className="form-field">
                              <label htmlFor={`cert-title-${idx}`}>
                                Certificate Title
                              </label>
                              <input
                                id={`cert-title-${idx}`}
                                type="text"
                                value={cert.title}
                                onChange={(e) =>
                                  updateDraft((d) => {
                                    d.certifications[idx]!.title =
                                      e.target.value;
                                    return d;
                                  })
                                }
                              />
                            </div>
                            <div className="form-field">
                              <label htmlFor={`cert-issuer-${idx}`}>
                                Issuer
                              </label>
                              <input
                                id={`cert-issuer-${idx}`}
                                type="text"
                                value={cert.issuer}
                                onChange={(e) =>
                                  updateDraft((d) => {
                                    d.certifications[idx]!.issuer =
                                      e.target.value;
                                    return d;
                                  })
                                }
                              />
                            </div>
                            <div className="form-field">
                              <label htmlFor={`cert-date-${idx}`}>Date</label>
                              <input
                                id={`cert-date-${idx}`}
                                type="text"
                                value={cert.date}
                                onChange={(e) =>
                                  updateDraft((d) => {
                                    d.certifications[idx]!.date =
                                      e.target.value;
                                    return d;
                                  })
                                }
                              />
                            </div>
                            <div className="form-field">
                              <label htmlFor={`cert-credid-${idx}`}>
                                Credential ID (optional)
                              </label>
                              <input
                                id={`cert-credid-${idx}`}
                                type="text"
                                value={cert.credentialId || ""}
                                onChange={(e) =>
                                  updateDraft((d) => {
                                    d.certifications[idx]!.credentialId =
                                      e.target.value || undefined;
                                    return d;
                                  })
                                }
                              />
                            </div>
                            <div className="form-field field-wide">
                              <label htmlFor={`cert-verify-${idx}`}>
                                Verification URL (optional)
                              </label>
                              <input
                                id={`cert-verify-${idx}`}
                                type="url"
                                value={cert.verificationUrl || ""}
                                onChange={(e) =>
                                  updateDraft((d) => {
                                    d.certifications[idx]!.verificationUrl =
                                      e.target.value || undefined;
                                    return d;
                                  })
                                }
                              />
                            </div>
                            <div className="form-field field-wide">
                              <label htmlFor={`cert-desc-${idx}`}>
                                Description
                              </label>
                              <textarea
                                id={`cert-desc-${idx}`}
                                rows={2}
                                value={cert.description || ""}
                                onChange={(e) =>
                                  updateDraft((d) => {
                                    d.certifications[idx]!.description =
                                      e.target.value || undefined;
                                    return d;
                                  })
                                }
                              />
                            </div>
                            <div className="form-field">
                              <span className="owner-field-label">
                                Preview Image
                              </span>
                              <div className="owner-upload-controls">
                                <label
                                  htmlFor={`cert-img-upload-${idx}`}
                                  className="button button-secondary"
                                >
                                  <Upload size={14} />
                                  <span>
                                    {uploadingField === `cert-img-${idx}`
                                      ? "Uploading…"
                                      : "Upload preview image"}
                                  </span>
                                </label>
                                <input
                                  id={`cert-img-upload-${idx}`}
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={(e) =>
                                    void handleFileUpload(
                                      e,
                                      `cert-img-${idx}`,
                                      (url) => {
                                        updateDraft((d) => {
                                          d.certifications[idx]!.image = url;
                                          return d;
                                        });
                                      },
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="form-field">
                              <span className="owner-field-label">
                                Certificate PDF
                              </span>
                              <div className="owner-upload-controls">
                                <label
                                  htmlFor={`cert-pdf-upload-${idx}`}
                                  className="button button-secondary"
                                >
                                  <Upload size={14} />
                                  <span>
                                    {uploadingField === `cert-pdf-${idx}`
                                      ? "Uploading…"
                                      : "Upload PDF file"}
                                  </span>
                                </label>
                                <input
                                  id={`cert-pdf-upload-${idx}`}
                                  type="file"
                                  accept="application/pdf"
                                  className="sr-only"
                                  onChange={(e) =>
                                    void handleFileUpload(
                                      e,
                                      `cert-pdf-${idx}`,
                                      (url) => {
                                        updateDraft((d) => {
                                          d.certifications[idx]!.pdfUrl = url;
                                          return d;
                                        });
                                      },
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </OwnerEditor>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 07: CONTACT, FOOTER & SECURITY */}
            {activeTab === "contact" && (
              <div className="owner-stack">
                <OwnerEditor
                  {...editorControls}
                  id="contact-details"
                  title="Contact Section & Social Profiles"
                  summary={draft.personal.email}
                  icon={Mail}
                >
                  <p className="eyebrow">07 · Contact Details & Socials</p>
                  <h3>Contact Section & Social Profiles</h3>
                  <div className="form-grid mt-4">
                    <div className="form-field">
                      <label htmlFor="contact-email-field">
                        Public Contact Email
                      </label>
                      <input
                        id="contact-email-field"
                        type="email"
                        value={draft.personal.email}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.email = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="contact-phone-display">
                        Phone Display Text
                      </label>
                      <input
                        id="contact-phone-display"
                        type="text"
                        value={draft.personal.phone}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.phone = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="contact-phone-href">
                        Phone Dial Link (tel:)
                      </label>
                      <input
                        id="contact-phone-href"
                        type="text"
                        value={draft.personal.phoneHref}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.phoneHref = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="social-github">GitHub Profile URL</label>
                      <input
                        id="social-github"
                        type="url"
                        value={draft.personal.socials.github}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.socials.github = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="social-linkedin">
                        LinkedIn Profile URL
                      </label>
                      <input
                        id="social-linkedin"
                        type="url"
                        value={draft.personal.socials.linkedin}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.socials.linkedin = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="social-facebook">
                        Facebook Profile URL
                      </label>
                      <input
                        id="social-facebook"
                        type="url"
                        value={draft.personal.socials.facebook}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.socials.facebook = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="social-whatsapp">WhatsApp URL</label>
                      <input
                        id="social-whatsapp"
                        type="url"
                        value={draft.personal.socials.whatsapp}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.socials.whatsapp = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="contact-eyebrow">Contact Eyebrow</label>
                      <input
                        id="contact-eyebrow"
                        type="text"
                        value={draft.personal.contactEyebrow}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.contactEyebrow = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="contact-prompt-text">
                        Contact Invitation Copy
                      </label>
                      <textarea
                        id="contact-prompt-text"
                        rows={2}
                        value={draft.personal.contactPrompt}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.contactPrompt = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="footer-tagline-input">
                        Footer Tagline
                      </label>
                      <input
                        id="footer-tagline-input"
                        type="text"
                        value={draft.personal.footerTagline}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.footerTagline = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="copyright-year-input">
                        Footer Copyright Year
                      </label>
                      <input
                        id="copyright-year-input"
                        type="text"
                        value={draft.personal.copyrightYear}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.copyrightYear = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="seo-description-input">
                        SEO Meta Description
                      </label>
                      <textarea
                        id="seo-description-input"
                        rows={2}
                        value={draft.personal.seoDescription}
                        onChange={(e) =>
                          updateDraft((d) => {
                            d.personal.seoDescription = e.target.value;
                            return d;
                          })
                        }
                      />
                    </div>
                  </div>
                </OwnerEditor>

                {/* Owner Account Security */}
                <OwnerEditor
                  {...editorControls}
                  id="security"
                  title="Owner Sign-In Email & Password"
                  summary={securityEmail}
                  icon={Lock}
                  publishable={false}
                >
                  <p className="eyebrow">
                    <Lock size={13} /> Owner Authentication Security
                  </p>
                  <h3>Update Owner Sign-In Email & Password</h3>
                  <form
                    onSubmit={handleUpdateCredentials}
                    className="form-grid mt-4"
                  >
                    <div className="form-field">
                      <label htmlFor="sec-owner-email">Owner Login Email</label>
                      <input
                        id="sec-owner-email"
                        type="email"
                        required
                        value={securityEmail}
                        onChange={(e) => setSecurityEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="sec-current-password">
                        Current Password (required)
                      </label>
                      <input
                        id="sec-current-password"
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-field field-wide">
                      <label htmlFor="sec-new-password">
                        New Password (leave blank to keep current password)
                      </label>
                      <input
                        id="sec-new-password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    {securityMessage && (
                      <div
                        className={`field-wide owner-alert ${securityMessage.type === "error" ? "owner-alert-error" : "owner-alert-success"}`}
                        role="alert"
                      >
                        {securityMessage.text}
                      </div>
                    )}
                    <div className="field-wide">
                      <button
                        type="submit"
                        className="button button-secondary"
                        disabled={updatingSecurity}
                      >
                        <Lock size={14} />
                        <span>
                          {updatingSecurity
                            ? "Updating credentials…"
                            : "Update login credentials"}
                        </span>
                      </button>
                    </div>
                  </form>
                </OwnerEditor>
              </div>
            )}
          </section>
        </div>
      </main>

      <Modal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === "save"
            ? "Save portfolio changes?"
            : confirmAction === "restore"
              ? "Restore baseline defaults?"
              : confirmAction === "view-portfolio"
                ? "Return to live portfolio?"
                : "Sign out of dashboard?"
        }
      >
        <p className="modal-description">
          {confirmAction === "save" &&
            "Your edits across all portfolio sections will be saved and published immediately to the live portfolio."}
          {confirmAction === "restore" &&
            "This will reset all portfolio content back to the original baseline defaults."}
          {confirmAction === "view-portfolio" &&
            "Your owner session will stay active, so tapping the copyright notice in the footer will bring you directly back to the dashboard without signing in again."}
          {confirmAction === "logout" &&
            "Signing out will end your current owner session and require your email and password next time you open the dashboard."}
        </p>
        <div className="project-links">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setConfirmAction(null)}
          >
            Cancel
          </button>
          {confirmAction === "save" && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setConfirmAction(null);
                void handleSaveAll();
              }}
            >
              Confirm save
            </button>
          )}
          {confirmAction === "restore" && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setConfirmAction(null);
                void handleResetDefaults();
              }}
            >
              Confirm restore
            </button>
          )}
          {confirmAction === "view-portfolio" && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setConfirmAction(null);
                navigateTo("/");
              }}
            >
              Confirm view portfolio
            </button>
          )}
          {confirmAction === "logout" && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setConfirmAction(null);
                onLogout();
              }}
            >
              Confirm sign out
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

function TimelineEntryEditor({
  prefix,
  entry,
  onChange,
  onDelete,
}: {
  prefix: string;
  entry: TimelineEntry;
  onChange: (next: TimelineEntry) => void;
  onDelete: () => void;
}) {
  return (
    <div className="owner-subcard">
      <div className="owner-subcard-top">
        <strong>{entry.title}</strong>
        <button
          type="button"
          className="icon-button owner-delete-btn"
          aria-label={`Delete ${entry.title}`}
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="form-grid mt-3">
        <div className="form-field">
          <label htmlFor={`${prefix}-title`}>Title / Role</label>
          <input
            id={`${prefix}-title`}
            type="text"
            value={entry.title}
            onChange={(e) => onChange({ ...entry, title: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`${prefix}-org`}>Organization / School</label>
          <input
            id={`${prefix}-org`}
            type="text"
            value={entry.organization}
            onChange={(e) =>
              onChange({ ...entry, organization: e.target.value })
            }
          />
        </div>
        <div className="form-field">
          <label htmlFor={`${prefix}-date`}>Date / Period</label>
          <input
            id={`${prefix}-date`}
            type="text"
            value={entry.date}
            onChange={(e) => onChange({ ...entry, date: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`${prefix}-kind`}>Entry Type</label>
          <select
            id={`${prefix}-kind`}
            className="owner-select"
            value={entry.kind}
            onChange={(e) =>
              onChange({
                ...entry,
                kind: e.target.value as TimelineEntry["kind"],
              })
            }
          >
            <option value="education">Education</option>
            <option value="work">Work Experience</option>
            <option value="project">Practical Learning</option>
          </select>
        </div>
        <div className="form-field field-wide">
          <label htmlFor={`${prefix}-desc`}>Summary Description</label>
          <textarea
            id={`${prefix}-desc`}
            rows={2}
            value={entry.description}
            onChange={(e) =>
              onChange({ ...entry, description: e.target.value })
            }
          />
        </div>
        <div className="form-field field-wide">
          <label htmlFor={`${prefix}-highlights`}>
            Highlights / Bullet Points (one per line)
          </label>
          <textarea
            id={`${prefix}-highlights`}
            rows={4}
            value={entry.highlights.join("\n")}
            onChange={(e) =>
              onChange({
                ...entry,
                highlights: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
