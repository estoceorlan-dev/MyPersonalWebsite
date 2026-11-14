import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Projects from "./sections/Projects";
import Experience from "./sections/Experience";
import Certifications from "./sections/Certifications";
import Contact from "./sections/Contact";
import { PortfolioProvider, getApiUrl } from "./context/PortfolioContext";
import { navigateTo, useRoute } from "./utils/router";
import OwnerLogin, {
  OWNER_EMAIL_KEY,
  OWNER_TOKEN_KEY,
} from "./owner/OwnerLogin";
import OwnerDashboard from "./owner/OwnerDashboard";

function AppRoutes() {
  const route = useRoute();
  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem(OWNER_TOKEN_KEY) || "";
    } catch {
      return "";
    }
  });
  const [ownerEmail, setOwnerEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(OWNER_EMAIL_KEY) || "estoce.orlan@gmail.com";
    } catch {
      return "estoce.orlan@gmail.com";
    }
  });

  useEffect(() => {
    if (route === "owner-login" && token) {
      // Session is still active: bypass login and go directly to the dashboard
      navigateTo("/owner");
      return;
    }

    if (route === "owner-dashboard") {
      if (!token) {
        navigateTo("/owner/login");
        return;
      }
      // Verify active session token (only clear session if token expired/invalid)
      void fetch(getApiUrl("/api/auth/me"), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (res.status === 401) {
            handleLogout();
            return;
          }
          const data = await res.json().catch(() => ({}));
          if (data?.owner?.email) {
            setOwnerEmail(data.owner.email);
          }
        })
        .catch(() => {
          // Keep current session if offline
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, token]);

  function handleAuthenticated(nextToken: string, nextEmail: string) {
    setToken(nextToken);
    setOwnerEmail(nextEmail);
  }

  function handleLogout() {
    setToken("");
    try {
      localStorage.removeItem(OWNER_TOKEN_KEY);
      localStorage.removeItem(OWNER_EMAIL_KEY);
    } catch {
      // Ignore storage errors
    }
    navigateTo("/owner/login");
  }

  if (route === "owner-login" || route === "owner-dashboard") {
    if (token) {
      return (
        <OwnerDashboard
          token={token}
          ownerEmail={ownerEmail}
          onLogout={handleLogout}
          onTokenRefreshed={handleAuthenticated}
        />
      );
    }
    return <OwnerLogin onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Certifications />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <PortfolioProvider>
      <MotionConfig reducedMotion="user">
        <AppRoutes />
      </MotionConfig>
    </PortfolioProvider>
  );
}
