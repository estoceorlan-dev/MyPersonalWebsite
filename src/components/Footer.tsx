import { ArrowUp } from "lucide-react";
import { personal } from "../data/personal";
import { SocialLinks } from "./Shared";

export default function Footer() {
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
            <p>Learning with intention. Building with care.</p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#about">About</a>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact</a>
          </nav>
          <SocialLinks />
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {personal.name}. All rights reserved.
          </span>
          <a href="#home">
            Back to top <ArrowUp size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
