import { useState } from "react";
import { Menu, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { navigation, personal } from "../data/personal";
import { useActiveSection } from "../hooks/useActiveSection";
import { ResumeButton } from "./Shared";
import { Modal } from "./Modal";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <a className="brand" href="#home" aria-label="Back to home">
          <span className="monogram">
            {personal.monogram}
            <span>.</span>
          </span>
          <span className="brand-caption">
            personal
            <br />
            portfolio
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(({ id, label }) => (
            <a
              href={`#${id}`}
              key={id}
              aria-current={active === id ? "location" : undefined}
            >
              {label}
              {active === id && (
                <motion.span
                  layoutId="nav-indicator"
                  className="nav-indicator"
                  transition={{ duration: 0.2 }}
                />
              )}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <ResumeButton className="button nav-resume" compact />
          <button
            className="icon-button menu-toggle"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Explore the portfolio"
          className="nav-modal"
        >
          <nav aria-label="Mobile navigation">
            {navigation.map(({ id, label }, index) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setOpen(false)}
                aria-current={active === id ? "location" : undefined}
              >
                <span>
                  <small>0{index + 1}</small>
                  {label}
                </span>
                <ArrowUpRight size={18} />
              </a>
            ))}
          </nav>
        </Modal>
      </div>
    </header>
  );
}
