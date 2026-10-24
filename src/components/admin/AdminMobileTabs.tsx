// src/components/admin/AdminMobileTabs.tsx
// Onglets horizontaux qui remplacent la sidebar sous 992px.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminNavFor } from "@/lib/admin-nav";

export function AdminMobileTabs() {
  const pathname = usePathname();
  const { role } = useAuth();

  return (
    <nav className="admin-mobile-tabs">
      {adminNavFor(role).map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`admin-mobile-tab${active ? " active" : ""}`}>
            <i className={item.icon}></i> {item.mobileLabel}
          </Link>
        );
      })}
    </nav>
  );
}
