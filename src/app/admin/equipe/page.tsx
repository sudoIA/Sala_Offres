// src/app/admin/equipe/page.tsx
// Équipe du back-office : chaque membre a son propre compte, son rôle
// (administrateur ou modérateur, voir staff-roles.ts) et sa double
// authentification. Ajouter une adresse qui n'a pas encore de compte le
// crée et lui envoie l'e-mail pour choisir son mot de passe.

"use client";

import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { CompanyTile } from "@/components/CompanyTile";
import { askText, confirmAction, notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/admin-log";
import { ROLE_INFO, STAFF_ROLES, type StaffRole, type TeamMember } from "@/lib/staff-roles";

const ROLE_BADGE: Record<StaffRole, { background: string; color: string }> = {
  admin: { background: "var(--sala-red-light)", color: "var(--sala-red)" },
  moderateur: { background: "var(--sala-green-light)", color: "var(--sala-green-dark)" },
};

export default function AdminTeamPage() {
  const { user } = useAuth();
  const { members, loading, error, addMember, updateMember, removeMember, resetMfa } = useTeam();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("moderateur");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    try {
      await action();
    } catch (err) {
      notify((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function sendInvitation(address: string) {
    await sendPasswordResetEmail(auth, address);
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    const label = name.trim() || address;
    run("add", async () => {
      const created = await addMember(address, name.trim(), role);
      await logAdminAction("promote", "roles", `${label} (${ROLE_INFO[role].label})`);
      if (created) {
        await sendInvitation(address);
        notify(`Compte créé. ${label} a reçu un e-mail pour choisir son mot de passe.`);
      } else {
        notify(`${label} a maintenant accès au back-office avec son compte existant.`);
      }
      setEmail("");
      setName("");
    });
  }

  function handleRole(member: TeamMember, next: StaffRole) {
    const label = member.name || member.email;
    run(member.uid, async () => {
      if (!(await confirmAction("Changer le rôle ?", `${label} devient ${ROLE_INFO[next].label.toLowerCase()} : ${ROLE_INFO[next].description}`))) return;
      await updateMember(member.uid, { role: next });
      await logAdminAction("update", "roles", `${label} : ${ROLE_INFO[next].label}`, member.uid);
      notify("Rôle modifié.");
    });
  }

  function handleRename(member: TeamMember) {
    run(member.uid, async () => {
      const next = await askText("Nom du membre", "Nom affiché dans le back-office", member.name);
      if (!next || next === member.name) return;
      await updateMember(member.uid, { name: next });
      await logAdminAction("update", "roles", `${member.email} renommé « ${next} »`, member.uid);
      notify("Nom modifié.");
    });
  }

  function handleResetMfa(member: TeamMember) {
    const label = member.name || member.email;
    run(member.uid, async () => {
      const text = `${label} pourra se connecter avec son seul mot de passe, puis devra configurer son nouveau téléphone.`;
      if (!(await confirmAction("Réinitialiser sa double authentification ?", text, "#dc3545"))) return;
      await resetMfa(member.email);
      await logAdminAction("settings", "securite", `Double authentification réinitialisée pour ${member.email}`);
      notify("Double authentification réinitialisée.");
    });
  }

  function handleResend(member: TeamMember) {
    run(member.uid, async () => {
      await sendInvitation(member.email);
      notify(`E-mail renvoyé à ${member.email}.`);
    });
  }

  function handleRemove(member: TeamMember) {
    const label = member.name || member.email;
    run(member.uid, async () => {
      const text = `${label} n'aura plus accès au back-office. Son compte reste utilisable comme simple compte candidat.`;
      if (!(await confirmAction("Retirer de l'équipe ?", text, "#dc3545"))) return;
      await removeMember(member.uid);
      await logAdminAction("demote", "roles", label, member.uid);
      notify("Accès retiré.");
    });
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Équipe</h1>
          <p className="admin-page-subtitle">
            Un compte personnel par membre de l&apos;équipe : chacun a son mot de passe, sa double authentification, et ses actions sont signées dans le Journal.
          </p>
        </div>
      </div>

      <div className="admin-panel">
        <h2><i className="fas fa-user-plus me-2"></i>Ajouter un membre</h2>
        <form onSubmit={handleAdd}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="teamName">Nom</label>
              <input id="teamName" type="text" maxLength={120} placeholder="Ex: Grâce Mabiala" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="teamEmail">Adresse e-mail</label>
              <input id="teamEmail" type="email" required placeholder="prenom@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <fieldset className="team-role-choice">
            <legend className="small fw-bold mb-2">Rôle</legend>
            {STAFF_ROLES.map((r) => (
              <label key={r} className={`team-role-option${role === r ? " active" : ""}`}>
                <input type="radio" name="teamRole" value={r} checked={role === r} onChange={() => setRole(r)} />
                <span>
                  <strong>{ROLE_INFO[r].label}</strong>
                  <span className="d-block small text-muted">{ROLE_INFO[r].description}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="small text-muted mt-2 mb-0">
            Sans compte sur Sala, la personne reçoit un e-mail pour choisir son mot de passe, puis se connecte sur la page de connexion admin.
          </p>
          <div className="form-actions" style={{ textAlign: "left" }}>
            <button type="submit" className="btn-sala-primary" disabled={busy === "add" || !email.trim()}>
              {busy === "add" ? "Ajout..." : "Ajouter à l'équipe"}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="admin-card-grid">
        {loading && (
          <div className="admin-card-empty admin-empty">
            <div className="spinner-border text-success"></div>
          </div>
        )}

        {!loading &&
          members.map((m) => {
            const isMe = m.uid === user?.uid;
            const lastLogin = m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString("fr-FR") : null;
            return (
              <div className="admin-card" key={m.uid}>
                <div className="admin-card-top">
                  <div className="admin-row-identity">
                    <CompanyTile company={m.name || m.email} />
                    <div>
                      <div className="title">
                        {m.name || "Sans nom"}
                        {isMe && <span className="text-muted fw-normal"> (vous)</span>}
                      </div>
                      <div className="subtitle">{m.email}</div>
                    </div>
                  </div>
                  <span className="admin-badge" style={ROLE_BADGE[m.role]}>{ROLE_INFO[m.role].label}</span>
                </div>
                <div className="admin-card-meta">
                  <span className={m.mfa ? "text-success" : "text-warning"}>
                    <i className={`fas ${m.mfa ? "fa-shield-alt" : "fa-exclamation-triangle"}`}></i>
                    {m.mfa ? "Double authentification active" : "Double authentification à configurer"}
                  </span>
                  <span>
                    <i className="far fa-clock"></i>
                    {lastLogin ? `Dernière connexion le ${lastLogin}` : "Jamais connecté"}
                  </span>
                </div>
                <div className="admin-card-footer flex-wrap gap-2">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={m.role}
                    disabled={isMe || busy === m.uid}
                    title={isMe ? "Un autre administrateur doit changer votre rôle." : "Changer le rôle"}
                    aria-label={`Rôle de ${m.name || m.email}`}
                    onChange={(e) => handleRole(m, e.target.value as StaffRole)}
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_INFO[r].label}</option>
                    ))}
                  </select>
                  <div className="d-flex gap-1">
                    {!m.lastLoginAt && (
                      <button className="btn-icon btn-icon-edit" title="Renvoyer l'e-mail pour choisir le mot de passe" disabled={busy === m.uid} onClick={() => handleResend(m)}>
                        <i className="fas fa-envelope"></i>
                      </button>
                    )}
                    <button className="btn-icon btn-icon-edit" title="Modifier le nom" disabled={busy === m.uid} onClick={() => handleRename(m)}>
                      <i className="fas fa-pen"></i>
                    </button>
                    {m.mfa && !isMe && (
                      <button className="btn-icon btn-icon-edit" title="Téléphone perdu : réinitialiser la double authentification" disabled={busy === m.uid} onClick={() => handleResetMfa(m)}>
                        <i className="fas fa-mobile-alt"></i>
                      </button>
                    )}
                    {!isMe && (
                      <button className="btn-icon btn-icon-delete" title="Retirer de l'équipe" disabled={busy === m.uid} onClick={() => handleRemove(m)}>
                        <i className="fas fa-user-minus"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
