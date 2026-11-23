import { useState } from "react";
import { Award, ArrowUpRight, Plus } from "lucide-react";
import { isCertificateImage, type Achievement, type Certification } from "../data/certifications";
import { usePortfolio, resolveMediaUrl } from "../context/PortfolioContext";
import { Reveal, SectionHeading } from "../components/Shared";
import { Modal } from "../components/Modal";
import { CertificateFilePreview } from "../components/CertificateFilePreview";

function EligibilityCard({ item, onViewPicture }: {
  item: Achievement;
  onViewPicture: (image: string) => void;
}) {
  const files = item.attachments ?? [];
  const pdf = files.find((file) => file.mimeType === "application/pdf" || /\.pdf$/i.test(file.filename));
  const picture = item.image || files.find(isCertificateImage)?.url;
  const otherFiles = files.filter((file) => file !== pdf && file.url !== picture);
  const cover = picture ? (
    <img className="eligibility-picture" src={resolveMediaUrl(picture)} alt="" loading="lazy" />
  ) : (
    <div className="credential-art" aria-hidden="true">
      <div className="mini-certificate">
        <Award size={30} /><i /><i /><span /><i />
      </div>
      <span className="credential-spark">+</span>
    </div>
  );
  return (
    <article className="eligibility-card">
      {pdf ? (
        <a href={resolveMediaUrl(pdf.url)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.title} PDF`}>
          {cover}
        </a>
      ) : picture ? (
        <button type="button" aria-label={`View ${item.title} certificate picture`} aria-haspopup="dialog" onClick={() => onViewPicture(picture)}>
          {cover}
        </button>
      ) : cover}
      <div>
        <p className="eyebrow">Professional eligibility</p>
        <h3>{item.title}</h3>
        <p>{item.organization}</p>
        <span className="credential-date">{item.date}</span>
      </div>
      {otherFiles.length > 0 && (
        <ul className="eligibility-files" aria-label="Certificate files">
          {otherFiles.map((file) => (
            <li key={file.url}><CertificateFilePreview file={file} pdf={pdf} /></li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function Certifications() {
  const { content } = usePortfolio();
  const { certifications, achievements, sectionHeadings } = content;
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Omit<Certification, "id"> | null>(null);
  return (
    <section
      id="certifications"
      className="section section-white"
      aria-label="Credentials and eligibility"
    >
      <div className="container">
        <Reveal>
          <SectionHeading
            number="05"
            label={sectionHeadings.certifications.label}
            title={sectionHeadings.certifications.title}
            description={sectionHeadings.certifications.description}
          />
        </Reveal>
        <div className="eligibility-list">
          {achievements.map((item) => (
            <Reveal key={item.title}>
              <EligibilityCard item={item} onViewPicture={(image) => setSelected({ ...item, image, issuer: item.organization })} />
            </Reveal>
          ))}
        </div>
        {certifications.length > 0 && (
          <>
            <div className="certifications-grid">
              {(expanded ? certifications : certifications.slice(0, 4)).map(
                (certificate) => (
                  <button
                    className="certificate-card"
                    key={certificate.id}
                    onClick={() => setSelected(certificate)}
                  >
                    {certificate.image ? (
                      <img
                        src={resolveMediaUrl(certificate.image)}
                        alt={`${certificate.title} certificate`}
                        loading="lazy"
                      />
                    ) : (
                      <Award size={32} />
                    )}
                    <span className="eyebrow">{certificate.issuer}</span>
                    <strong>{certificate.title}</strong>
                    <span>
                      {certificate.date}
                      <ArrowUpRight size={17} />
                    </span>
                  </button>
                ),
              )}
            </div>
            {certifications.length > 4 && (
              <button
                className="button button-secondary mt-6"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded
                  ? "Show fewer"
                  : `View all ${certifications.length} certifications`}
                <Plus size={16} />
              </button>
            )}
          </>
        )}
        {!achievements.length && !certifications.length && (
          <p className="muted">
            Credentials will be added here as they are available.
          </p>
        )}
      </div>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || "Certification"}
      >
        {selected && (
          <>
            {selected.image && (
              <img
                className="certificate-full"
                src={resolveMediaUrl(selected.image)}
                alt={`${selected.title} certificate`}
              />
            )}
            <p className="muted">
              {selected.issuer} · {selected.date}
            </p>
            {selected.description && (
              <p className="modal-description">{selected.description}</p>
            )}
            {selected.credentialId && (
              <p className="muted">Credential ID: {selected.credentialId}</p>
            )}
            <div className="certificate-actions">
              {selected.pdfUrl && (
                <a
                  className="button button-primary"
                  href={resolveMediaUrl(selected.pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View PDF
                  <ArrowUpRight size={16} />
                </a>
              )}
              {selected.verificationUrl && (
                <a
                  className="button button-secondary"
                  href={selected.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Verify credential
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
