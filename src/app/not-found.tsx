// src/app/not-found.tsx
// Page 404 sur-mesure au design Sala (remplace le gabarit générique
// "JobEntry" de l'ancien template, jamais adapté à la marque).

import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        background: "var(--sala-bg)",
      }}
    >
      <Image src="/img/logo_transparent.png" alt="Logo Sala" width={140} height={50} style={{ height: 50, width: "auto", marginBottom: 28 }} />
      <div style={{ fontFamily: "var(--sala-font-display)", fontWeight: 800, fontSize: "4.5rem", color: "var(--sala-green)", lineHeight: 1 }}>
        404
      </div>
      <h1 className="h4 fw-bold mt-3 mb-2" style={{ fontFamily: "var(--sala-font-display)" }}>
        Cette page n&apos;existe pas
      </h1>
      <p className="text-muted mb-4" style={{ maxWidth: 420 }}>
        Le lien que vous avez suivi est peut-être incorrect, ou la page a été déplacée.
      </p>
      <div className="d-flex gap-3">
        <Link href="/" className="btn-sala-primary py-2 px-4">
          <i className="fas fa-home me-2"></i> Retour à l&apos;accueil
        </Link>
        <Link href="/offres" className="btn-sala-outline py-2 px-4">
          <i className="fas fa-briefcase me-2"></i> Voir les offres
        </Link>
      </div>
    </div>
  );
}
