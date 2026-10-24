import { describe, expect, it } from "vitest";
import { adminNavFor, canAccessAdminPath } from "@/lib/admin-nav";
import { isStaffRole, staffDisplayName } from "@/lib/staff-roles";

describe("isStaffRole", () => {
  it("n'accepte que les rôles connus", () => {
    expect(isStaffRole("admin")).toBe(true);
    expect(isStaffRole("moderateur")).toBe(true);
    expect(isStaffRole("candidat")).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });
});

describe("staffDisplayName", () => {
  it("prend le premier nom renseigné", () => {
    expect(staffDisplayName("", "  ", "Grâce", "g@x.cg")).toBe("Grâce");
    expect(staffDisplayName(null, undefined, "g@x.cg")).toBe("g@x.cg");
  });
});

describe("accès au back-office selon le rôle", () => {
  it("un modérateur ne voit que les offres, les imports et ses paramètres", () => {
    expect(adminNavFor("moderateur").map((i) => i.href)).toEqual(["/admin/offres", "/admin/imports", "/admin/parametres"]);
    expect(canAccessAdminPath("/admin/offres", "moderateur")).toBe(true);
    expect(canAccessAdminPath("/admin", "moderateur")).toBe(false);
    expect(canAccessAdminPath("/admin/equipe", "moderateur")).toBe(false);
    expect(canAccessAdminPath("/admin/inconnue", "moderateur")).toBe(false);
  });
  it("un administrateur a accès à tout, rien sans rôle", () => {
    expect(adminNavFor("admin").length).toBeGreaterThan(10);
    expect(canAccessAdminPath("/admin/equipe", "admin")).toBe(true);
    expect(canAccessAdminPath("/admin/offres", null)).toBe(false);
  });
});
