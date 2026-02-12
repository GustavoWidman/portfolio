import React from "react";
import About from "./About";
import ExperienceSection from "./Experience";
import Hero from "./Hero";
import Projects from "./Projects";
import Stack from "./Stack";
import Footer from "./Footer";
import type { Language, Theme } from "../types";

interface PortfolioProps {
  lang: Language;
  theme: Theme;
  scrollY: number;
  scrollTo: (id: string) => void;
  showIntro: boolean;
  setShowIntro: React.Dispatch<React.SetStateAction<boolean>>;
}

const Portfolio: React.FC<PortfolioProps> = ({
  lang,
  theme,
  scrollY,
  scrollTo,
  showIntro,
  setShowIntro,
}) => {
  return (
    <>
      <Hero
        scrollY={scrollY}
        lang={lang}
        theme={theme}
        scrollTo={scrollTo}
        startTerminal={!showIntro}
      />

      <div className="relative bg-zinc-50 dark:bg-black z-20 transition-colors duration-300">
        <About lang={lang} />
        <Stack lang={lang} />
        <ExperienceSection lang={lang} />
        <Projects lang={lang} />
        <Footer lang={lang} />
      </div>
    </>
  );
};

export default Portfolio;
