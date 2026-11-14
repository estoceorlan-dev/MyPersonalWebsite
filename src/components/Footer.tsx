import { ArrowUp } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import { navigateTo } from "../utils/router";
import { SocialLinks } from "./Shared";

export default function Footer() {
  const { content } = usePortfolio();
  const { personal } = content;
  const year = personal.copyrightYear || String(new Date().getFullYear());
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <a className="brand" href="#home">
              <span className="monogram">
                {personal.monogram}
                <span>.</span>
              </span>
              <strong>{personal.name}</strong>
            </a>
            <p>
              {personal.footerTagline ||
                "Learning with intention. Building with care."}
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#about">About</a>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact</a>
          </nav>
          <SocialLinks />
        </div>
        <div className="footer-bottom">
          <a
            href="/owner/login"
            className="footer-copyright-link"
            onClick={(event) => {
              if (
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                navigateTo("/owner/login");
              }
            }}
          >
            © {year} {personal.name}. All rights reserved.
          </a>
          <a href="#home">
            Back to top <ArrowUp size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
