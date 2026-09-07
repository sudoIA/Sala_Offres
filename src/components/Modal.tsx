// src/components/Modal.tsx
// Modale générique gérée par état React (remplace les modales Bootstrap JS
// pour rester cohérent avec le reste de la migration).

"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 25, 20, 0.5)",
        zIndex: 1080,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: "100%",
          maxWidth: size === "lg" ? 780 : 520,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
          <h5 className="modal-title mb-0">{title}</h5>
          <button type="button" className="btn-close" aria-label="Fermer" onClick={onClose}></button>
        </div>
        <div className="modal-body" style={{ padding: "0 22px 22px", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
