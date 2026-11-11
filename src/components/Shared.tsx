import { useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Download,
  FileText,
  Github,
  Linkedin,
  Mail,
  Facebook,
} from "lucide-react";
import { personal } from "../data/personal";
import { Modal } from "./Modal";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: reduced ? 0 : 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  number,
  label,
  title,
  description,
}: {
  number: string;
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">
          <span>{number}</span> {label}
        </p>
        <h2>{title}</h2>
      </div>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

export function ResumeButton({
  className = "button button-secondary",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const content = (
    <>
      <Download size={compact ? 15 : 17} />
      <span>Download Resume</span>
    </>
  );
  if (personal.resumeUrl)
    return (
      <a
        className={className}
        href={personal.resumeUrl}
        download="Orlandone-Estoce-Resume.pdf"
      >
        {content}
      </a>
    );
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {content}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Resume not added yet"
      >
        <div className="empty-icon">
          <FileText size={28} />
        </div>
        <p className="muted">
          A downloadable resume will be available here once it has been added to
          the portfolio.
        </p>
        <a
          className="button button-primary mt-6"
          href="#contact"
          onClick={() => setOpen(false)}
        >
          Visit contact section <ArrowUpRight size={16} />
        </a>
      </Modal>
    </>
  );
}

export function SocialLinks({ labeled = false }: { labeled?: boolean }) {
  const links = [
    { label: "GitHub", icon: Github, url: personal.socials.github },
    { label: "LinkedIn", icon: Linkedin, url: personal.socials.linkedin },
    { label: "Facebook", icon: Facebook, url: personal.socials.facebook },
    {
      label: "Email",
      icon: Mail,
      url: personal.email ? `mailto:${personal.email}` : "",
    },
  ].filter(({ url }) => Boolean(url));
  return (
    <div className={`social-links ${labeled ? "social-labeled" : ""}`}>
      {links.map(({ label, icon: Icon, url }) => (
        <a
          key={label}
          href={url}
          aria-label={label}
          target={label === "Email" ? undefined : "_blank"}
          rel="noopener noreferrer"
        >
          <Icon size={18} />
          {labeled && <span>{label}</span>}
        </a>
      ))}
    </div>
  );
}
