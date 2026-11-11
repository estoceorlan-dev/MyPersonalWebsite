import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { personal } from "../data/personal";
import { Reveal, SocialLinks } from "../components/Shared";
import ContactForm from "../components/ContactForm";

export default function Contact() {
  return (
    <section
      id="contact"
      className="section contact-section"
      aria-label="Contact"
    >
      <div className="container contact-grid">
        <Reveal className="contact-copy">
          <p className="eyebrow">
            <span>06</span> Let’s connect
          </p>
          <h2>
            Good things start
            <br />
            with a <span>hello.</span>
            <ArrowUpRight
              className="contact-arrow"
              size={44}
              strokeWidth={1.2}
            />
          </h2>
          <p>
            Interested in working together or offering an internship
            opportunity? I’d love to hear from you.
          </p>
          <div className="contact-email">
            <Mail size={21} />
            <div>
              <span>EMAIL ME AT</span>
              {personal.email ? (
                <a href={`mailto:${personal.email}`}>{personal.email}</a>
              ) : (
                <strong>[Your professional email]</strong>
              )}
            </div>
          </div>
          <div className="contact-email">
            <Phone size={21} />
            <div>
              <span>CALL ME AT</span>
              <a href={`tel:${personal.phoneHref}`}>{personal.phone}</a>
            </div>
          </div>
          <SocialLinks labeled />
          <div className="contact-availability">
            <span className="status-dot" />
            {personal.availability}
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
