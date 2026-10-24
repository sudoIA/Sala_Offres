// src/lib/alert-emails.ts
// Envoi quotidien des alertes emploi (côté serveur uniquement, appelé par la
// tâche planifiée src/app/api/cron/collect-jobs). Pour chaque candidat ayant
// activé ses alertes (users/{uid}.jobAlerts), on lui envoie en un seul email
// les offres publiées depuis la veille qui correspondent à ses critères.
//
// Envoi via l'API Resend (https://resend.com, offre gratuite suffisante) :
// nécessite RESEND_API_KEY et ALERTS_FROM_EMAIL (ex : "Sala <alertes@ongsala.com>",
// domaine vérifié chez Resend) dans les variables d'environnement Vercel.
// Sans elles, l'étape est simplement ignorée (rien n'est cassé).

import type { Firestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import { jobMatchesAlert, type JobAlertPrefs } from "@/lib/job-alerts";
import { getSiteUrl } from "@/lib/site-url";

/**
 * E-mail et confirmation de l'adresse d'un compte, lus dans Firebase
 * Authentication par son API REST avec le compte de service. Remplace
 * firebase-admin/auth, qui ne se charge pas sur les serveurs Vercel (voir
 * id-token.ts).
 */
async function lookupAuthUser(uid: string): Promise<{ email?: string; emailVerified: boolean }> {
  const credential = getAdminApp().options.credential;
  if (!credential) throw new Error("Compte de service Firebase absent.");
  const { access_token } = await credential.getAccessToken();
  const res = await fetch("https://identitytoolkit.googleapis.com/v1/projects/sala-a6c15/accounts:lookup", {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: [uid] }),
  });
  if (!res.ok) throw new Error(`Firebase Authentication a répondu ${res.status}`);
  const data = (await res.json()) as { users?: { email?: string; emailVerified?: boolean }[] };
  const user = data.users?.[0];
  return { email: user?.email, emailVerified: user?.emailVerified === true };
}

export interface AlertRunResult {
  skipped: string | null;
  recipients: number;
  emailsSent: number;
  errors: number;
}

interface AlertJob {
  id: string;
  title?: string;
  company?: string;
  city?: string;
  contract?: string;
  body?: string;
}

const MAX_JOBS_PER_EMAIL = 15;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildEmailHtml(name: string, jobs: AlertJob[], siteUrl: string): string {
  const items = jobs
    .slice(0, MAX_JOBS_PER_EMAIL)
    .map(
      (j) => `<li style="margin-bottom:12px">
  <a href="${siteUrl}/offres/${encodeURIComponent(j.id)}" style="color:#2e7d32;font-weight:bold;text-decoration:none">${escapeHtml(j.title || "Offre d'emploi")}</a><br>
  <span style="color:#555">${escapeHtml([j.company, j.city, j.contract].filter(Boolean).join(" · "))}</span>
</li>`
    )
    .join("");
  const more = jobs.length > MAX_JOBS_PER_EMAIL ? `<p>… et ${jobs.length - MAX_JOBS_PER_EMAIL} autre(s) sur <a href="${siteUrl}/offres">ongsala.com</a>.</p>` : "";
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222">
  <h2 style="color:#2e7d32">Sala - nouvelles offres pour vous</h2>
  <p>Bonjour ${escapeHtml(name)},</p>
  <p>Voici les nouvelles offres publiées sur Sala qui correspondent à vos alertes :</p>
  <ul style="padding-left:18px">${items}</ul>
  ${more}
  <p style="color:#c62828;font-size:13px"><strong>Rappel :</strong> ne versez jamais d'argent pendant un processus de recrutement.</p>
  <hr style="border:none;border-top:1px solid #eee">
  <p style="font-size:12px;color:#888">Vous recevez cet email car vous avez activé les alertes emploi sur Sala.
  Pour les modifier ou les désactiver : <a href="${siteUrl}/profile">votre profil</a>, onglet « Alertes emploi ».</p>
</div>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.ALERTS_FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status} : ${await res.text()}`);
}

/** Envoie le récapitulatif des offres publiées ces dernières 24 h aux candidats abonnés. */
export async function sendJobAlertDigests(db: Firestore): Promise<AlertRunResult> {
  const result: AlertRunResult = { skipped: null, recipients: 0, emailsSent: 0, errors: 0 };
  if (!process.env.RESEND_API_KEY || !process.env.ALERTS_FROM_EMAIL) {
    result.skipped = "RESEND_API_KEY / ALERTS_FROM_EMAIL non configurés";
    return result;
  }

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 3600 * 1000);
  const jobsSnap = await db.collection("emplois").where("timestamp", ">", since).get();
  const jobs: AlertJob[] = jobsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<AlertJob, "id"> & { visibility?: boolean; deadline?: { toDate(): Date } }) }))
    .filter((j) => j.visibility !== false && (!j.deadline || j.deadline.toDate() > now));
  if (jobs.length === 0) {
    result.skipped = "aucune nouvelle offre depuis 24 h";
    return result;
  }

  const usersSnap = await db.collection("users").where("jobAlerts.enabled", "==", true).get();
  const siteUrl = getSiteUrl();

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data() as { email?: string; fullName?: string; jobAlerts?: JobAlertPrefs };
    if (!data.jobAlerts || !data.email) continue;
    const matches = jobs.filter((j) => jobMatchesAlert(j, data.jobAlerts as JobAlertPrefs));
    if (matches.length === 0) continue;
    result.recipients++;
    try {
      // Jamais d'envoi vers une adresse non confirmée (comptes fictifs).
      const authUser = await lookupAuthUser(userDoc.id);
      if (!authUser.emailVerified || !authUser.email) continue;
      const subject = matches.length > 1 ? `${matches.length} nouvelles offres pour vous sur Sala` : `Nouvelle offre pour vous : ${matches[0].title}`;
      await sendEmail(authUser.email, subject, buildEmailHtml(data.fullName || "", matches, siteUrl));
      result.emailsSent++;
    } catch (err) {
      result.errors++;
      console.error(`Alerte emploi non envoyée à ${userDoc.id} :`, err);
    }
  }
  return result;
}
