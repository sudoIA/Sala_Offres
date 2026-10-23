// tests/firestore-rules.test.mjs
// Teste firestore.rules contre l'émulateur Firestore (Java requis).
// Lancer : npm run test:rules
import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, increment, serverTimestamp } from "firebase/firestore";

const env = await initializeTestEnvironment({
  projectId: "demo-sala",
  firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 },
});

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "roles/admin1"), { role: "admin" });
  await setDoc(doc(db, "emplois/job1"), { title: "Offre", visibility: true });
  await setDoc(doc(db, "news/visible"), { title: "A", visibility: true });
  await setDoc(doc(db, "news/hidden"), { title: "B", visibility: false });
  await setDoc(doc(db, "users/legacy"), { fullName: "Ancien", lastLogin: "2020-01-01" });
  await setDoc(doc(db, "job_views/job1"), { count: 3 });
  await setDoc(doc(db, "Questions/q1"), { title: "Q" });
});

const anon = env.unauthenticatedContext().firestore();
const admin = env.authenticatedContext("admin1", { email: "a@sala.cg", email_verified: true }).firestore();
const user = env.authenticatedContext("u1", { email: "u1@x.cg", email_verified: true }).firestore();
const unverified = env.authenticatedContext("u2", { email: "u2@x.cg", email_verified: false }).firestore();
const legacy = env.authenticatedContext("legacy", { email: "l@x.cg", email_verified: true }).firestore();

const profile = {
  uid: "u1", fullName: "Jean", email: "u1@x.cg", city: "Brazzaville", phone: "", role: "candidat",
  photoURL: null, bio: "", skills: [], savedJobs: [], applications: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
};

let passed = 0;
let failed = 0;
async function check(name, promise) {
  try {
    await promise;
    passed++;
    console.log("  ok  ", name);
  } catch (err) {
    failed++;
    console.log("  FAIL", name, "-", err.message.split("\n")[0]);
  }
}

console.log("Contenu public & admin");
await check("visiteur lit une offre", assertSucceeds(getDoc(doc(anon, "emplois/job1"))));
await check("visiteur ne peut pas écrire une offre", assertFails(setDoc(doc(anon, "emplois/x"), { title: "x" })));
await check("candidat ne peut pas écrire une offre", assertFails(setDoc(doc(user, "emplois/x"), { title: "x" })));
await check("admin écrit une offre", assertSucceeds(setDoc(doc(admin, "emplois/x"), { title: "x" })));
await check("admin lit son rôle", assertSucceeds(getDoc(doc(admin, "roles/admin1"))));
await check("candidat lit son (absence de) rôle", assertSucceeds(getDoc(doc(user, "roles/u1"))));
await check("candidat ne peut pas se donner le rôle admin", assertFails(setDoc(doc(user, "roles/u1"), { role: "admin" })));

console.log("Profils candidats");
await check("création de son profil (inscription)", assertSucceeds(setDoc(doc(user, "users/u1"), profile)));
await check("profil d'un autre refusé", assertFails(setDoc(doc(user, "users/u9"), { ...profile, uid: "u9" })));
await check("champ inconnu refusé à la création", assertFails(setDoc(doc(unverified, "users/u2"), { ...profile, uid: "u2", isAdmin: true })));
await check("role 'admin' refusé dans le profil", assertFails(setDoc(doc(unverified, "users/u2"), { ...profile, uid: "u2", role: "admin" })));
await check("bio trop longue refusée", assertFails(updateDoc(doc(user, "users/u1"), { bio: "x".repeat(2001) })));
await check("mise à jour du profil", assertSucceeds(updateDoc(doc(user, "users/u1"), { fullName: "Jean K.", bio: "Comptable", skills: ["Excel"], updatedAt: serverTimestamp() })));
await check("enregistrement des alertes", assertSucceeds(updateDoc(doc(user, "users/u1"), { jobAlerts: { enabled: true, keywords: ["comptable"], city: "Brazzaville", contract: "CDI" } })));
await check("alertes avec champ inconnu refusées", assertFails(updateDoc(doc(user, "users/u1"), { jobAlerts: { enabled: true, keywords: [], city: "", contract: "", extra: 1 } })));
await check("ancien profil (champ historique) toujours modifiable", assertSucceeds(updateDoc(doc(legacy, "users/legacy"), { bio: "ok" })));
await check("admin lit un profil", assertSucceeds(getDoc(doc(admin, "users/u1"))));
await check("CV : email vérifié -> autorisé", assertSucceeds(addDoc(collection(user, "users/u1/cvs"), { name: "CV" })));
await check("CV : email non vérifié -> refusé", assertFails(addDoc(collection(unverified, "users/u2/cvs"), { name: "CV" })));
await check("suppression de son propre profil", assertSucceeds(deleteDoc(doc(user, "users/u1"))));

console.log("Inscriptions aux événements");
const reg = { eventId: "e1", eventTitle: "Salon", name: "Awa", email: "awa@mail.cg", phone: "060000000", registeredAt: new Date().toISOString() };
await check("inscription valide", assertSucceeds(addDoc(collection(anon, "inscriptions_evenements"), reg)));
await check("inscription sans email", assertSucceeds(addDoc(collection(anon, "inscriptions_evenements"), { ...reg, email: "" })));
await check("email invalide refusé", assertFails(addDoc(collection(anon, "inscriptions_evenements"), { ...reg, email: "pas-un-email" })));
await check("nom démesuré refusé", assertFails(addDoc(collection(anon, "inscriptions_evenements"), { ...reg, name: "x".repeat(500) })));
await check("champ en trop refusé", assertFails(addDoc(collection(anon, "inscriptions_evenements"), { ...reg, spam: "x" })));
await check("visiteur ne lit pas les inscrits", assertFails(getDocs(collection(anon, "inscriptions_evenements"))));

console.log("News Sala");
await check("visiteur lit un article visible", assertSucceeds(getDoc(doc(anon, "news/visible"))));
await check("visiteur ne lit pas un article masqué", assertFails(getDoc(doc(anon, "news/hidden"))));
await check("liste publique filtrée sur visibility", assertSucceeds(getDocs(query(collection(anon, "news"), where("visibility", "==", true)))));
await check("liste publique non filtrée refusée", assertFails(getDocs(collection(anon, "news"))));
await check("admin liste tout", assertSucceeds(getDocs(collection(admin, "news"))));
await check("candidat ne publie pas d'article", assertFails(addDoc(collection(user, "news"), { title: "x", visibility: true })));

console.log("Journal admin");
const log = { action: "create", target: "emplois", label: "Offre", targetId: null, uid: "admin1", email: "a@sala.cg", at: serverTimestamp() };
await check("admin ajoute une entrée à son nom", assertSucceeds(setDoc(doc(admin, "admin_logs/l1"), log)));
await check("entrée au nom d'un autre refusée", assertFails(addDoc(collection(admin, "admin_logs"), { ...log, uid: "autre" })));
await check("entrée non modifiable", assertFails(updateDoc(doc(admin, "admin_logs/l1"), { label: "falsifié" })));
await check("entrée non supprimable", assertFails(deleteDoc(doc(admin, "admin_logs/l1"))));
await check("candidat ne peut pas écrire au journal", assertFails(addDoc(collection(user, "admin_logs"), { ...log, uid: "u1" })));
await check("candidat ne lit pas le journal", assertFails(getDocs(collection(user, "admin_logs"))));

console.log("Erreurs & compteur de vues");
await check("personne n'écrit directement les erreurs", assertFails(addDoc(collection(admin, "client_errors"), { message: "x" })));
await check("admin lit les erreurs", assertSucceeds(getDocs(collection(admin, "client_errors"))));
await check("vue : création à 1", assertSucceeds(setDoc(doc(anon, "job_views/job2"), { count: increment(1) }, { merge: true })));
await check("vue : +1", assertSucceeds(setDoc(doc(anon, "job_views/job1"), { count: increment(1) }, { merge: true })));
await check("vue : +5 refusé", assertFails(setDoc(doc(anon, "job_views/job1"), { count: increment(5) }, { merge: true })));
await check("vue : remise à zéro refusée", assertFails(setDoc(doc(anon, "job_views/job1"), { count: 0 })));
await check("visiteur ne lit pas les compteurs", assertFails(getDoc(doc(anon, "job_views/job1"))));
await check("admin lit les compteurs", assertSucceeds(getDoc(doc(admin, "job_views/job1"))));

console.log("Sources personnalisées");
await check("admin ajoute une source", assertSucceeds(setDoc(doc(admin, "import_sources/s1"), { name: "Site", url: "https://exemple.cg/offres", enabled: true })));
await check("admin lit les sources", assertSucceeds(getDocs(collection(admin, "import_sources"))));
await check("candidat ne lit pas les sources", assertFails(getDocs(collection(user, "import_sources"))));
await check("visiteur n'ajoute pas de source", assertFails(setDoc(doc(anon, "import_sources/s2"), { name: "x", url: "https://x.cg", enabled: true })));

console.log("Application mobile");
await check("Questions lisibles une fois connecté", assertSucceeds(getDoc(doc(user, "Questions/q1"))));
await check("Questions illisibles sans compte", assertFails(getDoc(doc(anon, "Questions/q1"))));

await env.cleanup();
console.log(`\n${passed} réussis, ${failed} échoués`);
process.exit(failed ? 1 : 0);
