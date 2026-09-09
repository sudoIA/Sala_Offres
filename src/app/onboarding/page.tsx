// src/app/onboarding/page.tsx
// Diaporama de découverte de Sala : le problème résolu, puis une diapositive
// par mission de l'ONG (reprises de la page "À propos"), affiché via l'icône
// "?" des pages de type application.

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ONBOARDING_SLIDES } from "@/lib/onboarding-content";

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = ONBOARDING_SLIDES[index];
  const isLast = index === ONBOARDING_SLIDES.length - 1;

  function complete() {
    try {
      localStorage.setItem("sala_onboarded", "true");
    } catch {
      // ignore
    }
    router.push("/offres");
  }

  function next() {
    if (isLast) complete();
    else setIndex((i) => i + 1);
  }

  return (
    <div style={{ background: "#f8faf9", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between", overflowX: "hidden" }}>
      <header className="p-3 px-md-4 d-flex justify-content-between align-items-center">
        <Link href="/" className="d-flex align-items-center text-decoration-none">
          <Image src="/img/logo_transparent.png" alt="Logo Sala" width={110} height={40} style={{ height: 40, width: "auto" }} className="me-2" />
          <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--sala-green)" }}>SALA</span>
        </Link>
        <button className="btn btn-link text-muted text-decoration-none fw-bold small" onClick={complete}>
          Passer <i className="fas fa-arrow-right ms-1"></i>
        </button>
      </header>

      <main className="container my-auto py-3">
        <div className="onboarding-card">
          <span className="onboarding-step-indicator">
            {index + 1} / {ONBOARDING_SLIDES.length}
          </span>

          {slide.kind === "photo" ? (
            <div className="onboarding-photo-frame">
              <Image src={slide.image} alt={slide.imageAlt} width={300} height={536} style={{ width: "100%", height: "auto" }} />
            </div>
          ) : (
            <div className="slide-illustration" style={{ background: slide.themeColors.bg, color: slide.themeColors.color }}>
              <i className={`${slide.icon} fa-4x`}></i>
            </div>
          )}

          <h2 className="h3 fw-bold mb-3">{slide.title}</h2>
          <p className="text-secondary mb-4" style={{ fontSize: "1rem", lineHeight: 1.6, minHeight: 60 }}>
            {slide.description}
          </p>

          <div className="onboarding-dots">
            {ONBOARDING_SLIDES.map((_, i) => (
              <button key={i} className={`onboarding-dot${i === index ? " active" : ""}`} onClick={() => setIndex(i)} aria-label={`Diapositive ${i + 1}`}></button>
            ))}
          </div>

          <button className="btn-sala-primary w-100 py-3 rounded-pill fw-bold" onClick={next}>
            <span>{slide.btnText}</span> <i className="fas fa-arrow-right ms-2"></i>
          </button>
        </div>
      </main>

      <footer className="py-3 text-center text-muted small">
        ONG Sala — Pour l&apos;insertion professionnelle des jeunes au Congo
      </footer>
    </div>
  );
}
