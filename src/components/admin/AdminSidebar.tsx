// src/components/admin/AdminSidebar.tsx
// Sidebar bureau du back-office (masquée sous 992px au profit d'AdminMobileTabs).
// N'affiche que les sections ouvertes au rôle du membre connecté.

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminNavFor } from "@/lib/admin-nav";

const OVERVIEW_HREFS = ["/admin", "/admin/rapport"];

export function AdminSidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const items = adminNavFor(role);
  const overview = items.filter((item) => OVERVIEW_HREFS.includes(item.href));

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
        {overview.length > 0 && <div className="sala-nav-section-title">Vue</div>}
        {overview.map((item) => (
          <Link key={item.href} href={item.href} className={`sala-nav-item${pathname === item.href ? " active" : ""}`}>
            <i className={item.icon}></i> {item.label}
          </Link>
        ))}

        <div className="sala-nav-section-title">Contenu</div>
        {items.filter((item) => !OVERVIEW_HREFS.includes(item.href)).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sala-nav-item${pathname === item.href || pathname.startsWith(item.href + "/") ? " active" : ""}`}
          >
            <i className={item.icon}></i> {item.label}
          </Link>
        ))}

      </div>
    </aside>
  );
}
