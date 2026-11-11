export type EmailComposeOptions = {
  to: string;
  subject?: string;
  body?: string;
  isMobile: boolean;
};

/**
 * Builds a `mailto:` URL on mobile devices or a Gmail web compose URL on desktop.
 */
export function buildEmailComposeUrl({
  to,
  subject,
  body,
  isMobile,
}: EmailComposeOptions): string {
  if (!to) return "";
  if (isMobile) {
    const query: string[] = [];
    if (subject) query.push(`subject=${encodeURIComponent(subject)}`);
    if (body) query.push(`body=${encodeURIComponent(body)}`);
    return query.length ? `mailto:${to}?${query.join("&")}` : `mailto:${to}`;
  }
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
  });
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

