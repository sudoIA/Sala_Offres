// src/app/not-found.tsx
// Page 404 sur-mesure au design Sala : logo + slogan en grand, redirection
// automatique et silencieuse vers l'accueil après 3 secondes (aucun texte
// de compte à rebours affiché, choix explicite validé avec l'ONG).

"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/"), 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 24,
        background: "var(--sala-bg)",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 22 }}>
        <Image
          src="/img/logo_transparent.png"
          alt="Logo Sala"
          width={260}
          height={93}
          style={{ width: "min(56vw, 260px)", height: "auto" }}
          priority
        />
        <p
          style={{
            fontFamily: "var(--sala-font-display)",
            fontWeight: 800,
            fontSize: "clamp(1.5rem, 4.5vw, 2.2rem)",
            color: "var(--sala-green-dark)",
            letterSpacing: "0.01em",
            margin: 0,
            textWrap: "balance",
          }}
        >
          Sala, Mosala na Tshombo
        </p>
      </div>
      <div style={{ textAlign: "center", paddingTop: 20, fontSize: "0.78rem", color: "var(--sala-text-muted)" }}>
        © 2026 ONG Sala — République du Congo
      </div>
    </div>
  );
}
