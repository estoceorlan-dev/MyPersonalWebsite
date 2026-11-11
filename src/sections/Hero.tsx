import {
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  Code2,
  GraduationCap,
} from "lucide-react";
import { personal } from "../data/personal";
import { Reveal, ResumeButton, SocialLinks } from "../components/Shared";
import portrait from "../../assets/images/Portrait.jpg";

export default function Hero() {
  return (
    <section id="home" className="hero container" aria-labelledby="hero-title">
      <div className="hero-main">
        <Reveal className="hero-copy">
          <p className="hero-intro">
            <span className="small-line" />
            {personal.role} <span className="intro-divider">|</span>{" "}
            {personal.aspiration}
          </p>
          <h1 id="hero-title">
            Hello, I’m
            <br />
            <span>{personal.name}</span>
            <span className="heading-dot">.</span>
          </h1>
          <h2>{personal.introduction}</h2>
          <p className="hero-description">{personal.summary}</p>
          <div className="hero-actions">
            <a href="#projects" className="button button-primary">
              Explore My Work <ArrowUpRight size={18} />
            </a>
            <ResumeButton />
          </div>
          <div className="hero-social">
            <span>Find me online</span>
            <span className="social-line" />
            <SocialLinks />
          </div>
        </Reveal>
        <Reveal className="hero-portrait" delay={0.12}>
          <div className="portrait-background">
            <span className="portrait-asterisk" aria-hidden="true">
              ✳
            </span>
            <div className="portrait-frame">
              <img
                src={portrait}
                alt={personal.portraitAlt}
                width="1050"
                height="1498"
                fetchPriority="high"
              />
              <span className="portrait-caption">
                THE PERSON BEHIND THE PROJECTS
              </span>
            </div>
            <div className="availability">
              <span className="status-dot" />
              {personal.availability}
            </div>
            <div className="student-card">
              <span className="student-icon">
                <GraduationCap size={23} />
              </span>
              <div>
                <strong>Always a student.</strong>
                <span>Always building something.</span>
              </div>
              <ArrowUpRight size={17} />
            </div>
            <span className="portrait-code" aria-hidden="true">
              <Code2 size={22} />
            </span>
          </div>
        </Reveal>
      </div>
      <div className="hero-bottom">
        <a href="#about">
          <ArrowDown size={16} /> A little more about me
        </a>
        <span>
          Learning with intention. Building with care.{" "}
          <ArrowDownRight size={18} />
        </span>
      </div>
    </section>
  );
}
