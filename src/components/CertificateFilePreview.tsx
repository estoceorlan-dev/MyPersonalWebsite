import { useState } from "react";
import { isCertificateImage } from "../data/certifications";
import type { CertificateFile } from "../data/certifications";
import { resolveMediaUrl } from "../context/PortfolioContext";

export function CertificateFilePreview({ file, pdf }: { file: CertificateFile; pdf?: CertificateFile }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (isCertificateImage(file) && !imageFailed) {
    return (
      <a className="certificate-file-preview" href={resolveMediaUrl(pdf?.url ?? file.url)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${pdf?.filename ?? file.filename}`}>
        <img src={resolveMediaUrl(file.url)} alt={`Certificate image: ${file.filename}`} loading="lazy" onError={() => setImageFailed(true)} />
      </a>
    );
  }
  return <a className="eligibility-file-link" href={resolveMediaUrl(file.url)} target="_blank" rel="noopener noreferrer">{file.filename}</a>;
}
