// src/components/admin/AdminSidebar.tsx
// Sidebar bureau du back-office (masquée sous 992px au profit d'AdminMobileTabs).

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sala-sidebar">
      <div className="sala-sidebar-header" style={{ justifyContent: "space-between" }}>
        <Link href="/" className="d-flex align-items-center text-decoration-none gap-2">
          <Image src="/img/logo_transparent.png" alt="Logo Sala" width={100} height={34} style={{ height: 34, width: "auto" }} />
          <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--sala-green-dark)" }}>SALA</span>
        </Link>
        <span className="sala-sidebar-brand-tag">Admin</span>
      </div>

      <div className="sala-sidebar-nav">
        <div className="sala-nav-section-title">Vue</div>
        {ADMIN_NAV_ITEMS.slice(0, 1).map((item) => (
          <Link key={item.href} href={item.href} className={`sala-nav-item${pathname === item.href ? " active" : ""}`}>
            <i className={item.icon}></i> {item.label}
          </Link>
        ))}

        <div className="sala-nav-section-title">Contenu</div>
        {ADMIN_NAV_ITEMS.slice(1).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sala-nav-item${pathname === item.href || pathname.startsWith(item.href + "/") ? " active" : ""}`}
          >
            <i className={item.icon}></i> {item.label}
          </Link>
        ))}

        <div className="sala-nav-section-title">Bientôt disponible</div>
        <span className="sala-nav-item disabled"><i className="fas fa-newspaper"></i> News Sala</span>
        <span className="sala-nav-item disabled"><i className="fas fa-gamepad"></i> Jeux</span>
      </div>
    </aside>
  );
}
