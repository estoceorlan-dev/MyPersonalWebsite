import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { personal } from "../data/personal";

type Fields = { name: string; email: string; subject: string; message: string };
const initial: Fields = { name: "", email: "", subject: "", message: "" };
export default function ContactForm() {
  const [fields, setFields] = useState(initial);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Partial<Fields> = {};
    if (!fields.name.trim()) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
      next.email = "Please enter a valid email address.";
    if (!fields.subject.trim()) next.subject = "Please add a subject.";
    if (fields.message.trim().length < 10)
      next.message = "Please write a message of at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length) {
      setFeedback("Please check the highlighted fields.");
      form.current
        ?.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)
        ?.focus();
      return;
    }
    const body = `${fields.message.trim()}\n\nFrom: ${fields.name.trim()}\nReply to: ${fields.email.trim()}`;
    setDraft(`Subject: ${fields.subject.trim()}\n\n${body}`);
    setCopied(false);
    if (personal.email) {
      window.location.href = `mailto:${personal.email}?subject=${encodeURIComponent(fields.subject.trim())}&body=${encodeURIComponent(body)}`;
      setFeedback(
        "Your email draft is ready. Finish sending it in your email app, or copy it below. This website has not sent a message.",
      );
    } else
      setFeedback(
        "Your draft is ready. The portfolio’s email address has not been added yet. You can copy your draft below; nothing has been sent.",
      );
  }
  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setFeedback(
        "Copy is unavailable in this browser. Select and copy the draft text below.",
      );
    }
  }
  return (
    <form ref={form} className="contact-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <h3>Let’s start a conversation.</h3>
        <span>01 — Say hello</span>
      </div>
      <div className="form-grid">
        {(["name", "email", "subject", "message"] as const).map((field) => (
          <div
            className={`form-field ${field === "subject" || field === "message" ? "field-wide" : ""}`}
            key={field}
          >
            <label htmlFor={`contact-${field}`}>
              {field === "name"
                ? "Your name"
                : field === "email"
                  ? "Email address"
                  : field === "subject"
                    ? "Subject"
                    : "Your message"}{" "}
              <span aria-hidden="true">*</span>
            </label>
            {field === "message" ? (
              <textarea
                id={`contact-${field}`}
                name={field}
                value={fields[field]}
                maxLength={3000}
                rows={4}
                required
                placeholder="Tell me a little about the opportunity…"
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? `${field}-error` : undefined}
                onChange={(event) => {
                  setFields({ ...fields, [field]: event.target.value });
                  setDraft("");
                  setFeedback("");
                }}
              />
            ) : (
              <input
                id={`contact-${field}`}
                name={field}
                type={field === "email" ? "email" : "text"}
                autoComplete={
                  field === "name"
                    ? "name"
                    : field === "email"
                      ? "email"
                      : undefined
                }
                required
                maxLength={field === "email" ? 254 : 120}
                value={fields[field]}
                placeholder={
                  field === "name"
                    ? "Your name"
                    : field === "email"
                      ? "you@company.com"
                      : "An internship opportunity, a project…"
                }
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? `${field}-error` : undefined}
                onChange={(event) => {
                  setFields({ ...fields, [field]: event.target.value });
                  setDraft("");
                  setFeedback("");
                }}
              />
            )}
            {errors[field] && (
              <span className="field-error" id={`${field}-error`}>
                {errors[field]}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="form-bottom">
        <p>
          {personal.email
            ? "Opens your email app. You review and send."
            : "Prepare a draft. Contact email to be added."}
        </p>
        <button type="submit" className="button button-primary">
          Prepare email <ArrowUpRight size={17} />
        </button>
      </div>
      <p className="form-feedback" role="status">
        {feedback}
      </p>
      {draft && (
        <div className="draft-preview">
          <label htmlFor="email-draft">Your email draft</label>
          <textarea id="email-draft" value={draft} readOnly rows={6} />
          <button
            type="button"
            className="button button-secondary"
            onClick={copyDraft}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy draft"}
          </button>
        </div>
      )}
    </form>
  );
}
