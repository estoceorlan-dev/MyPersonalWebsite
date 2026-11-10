import { useState } from "react";
import { Award, ArrowUpRight, Plus, Trophy } from "lucide-react";
import { certifications, achievements } from "../data/certifications";
import type { Certification } from "../data/certifications";
import { Reveal, SectionHeading } from "../components/Shared";
import { Modal } from "../components/Modal";

export default function Certifications() {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Certification | null>(null);
  return (
    <section
      id="certifications"
      className="section section-white"
      aria-label="Certifications and achievements"
    >
      <div className="container">
        <Reveal>
          <SectionHeading
            number="05"
            label="Learning beyond the classroom"
            title="Room to keep growing."
            description="A collection for verified certifications, academic achievements, and milestones along the way."
          />
        </Reveal>
        {certifications.length ? (
          <>
            <div className="certifications-grid">
              {(expanded ? certifications : certifications.slice(0, 3)).map(
                (certificate) => (
                  <button
                    className="certificate-card"
                    key={certificate.id}
                    onClick={() => setSelected(certificate)}
                  >
                    {certificate.image ? (
                      <img
                        src={certificate.image}
                        alt={`${certificate.title} certificate`}
                        loading="lazy"
                      />
                    ) : (
                      <Award size={32} />
                    )}
                    <span className="eyebrow">{certificate.issuer}</span>
                    <strong>{certificate.title}</strong>
                    <span>
                      {certificate.date} <ArrowUpRight size={17} />
                    </span>
                  </button>
                ),
              )}
            </div>
            {certifications.length > 3 && (
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
        ) : (
          <Reveal>
            <div className="credentials-placeholder">
              <div className="credential-art" aria-hidden="true">
                <div className="mini-certificate">
                  <Award size={30} />
                  <i />
                  <i />
                  <span />
                  <i />
                </div>
                <span className="credential-spark">+</span>
              </div>
              <div>
                <p className="eyebrow">A space for the milestones</p>
                <h3>Every new skill is a step forward.</h3>
                <p>
                  Verified certifications will be added here.
                  <br />
                  There are no published credentials yet.
                </p>
              </div>
              <span className="outline-pill">
                Always learning <Plus size={14} />
              </span>
            </div>
          </Reveal>
        )}
        <div className="achievements">
          <div className="achievement-heading">
            <Trophy size={19} />
            <h3>Achievements & other credentials</h3>
          </div>
          {achievements.length ? (
            achievements.map((item) => (
              <article key={item.title}>
                <h4>{item.title}</h4>
                <p>
                  {item.organization} · {item.date}
                </p>
                <p>{item.description}</p>
              </article>
            ))
          ) : (
            <p>Academic achievements and relevant credentials to be added.</p>
          )}
        </div>
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
                src={selected.image}
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
            {selected.verificationUrl && (
              <a
                className="button button-primary mt-6"
                href={selected.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Verify credential <ArrowUpRight size={16} />
              </a>
            )}
          </>
        )}
      </Modal>
    </section>
  );
}
