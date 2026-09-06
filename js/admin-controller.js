// js/admin-controller.js
// Contrôleur du tableau de bord Administration Sala (Lot 7)
// Gère : garde d'accès admin, navigation des sections, et CRUD Firestore
// pour les Offres d'emploi, les Événements et les 3 Annuaires (Universités, Entreprises, Clubs d'Anglais).

import {
  auth, db,
  doc, getDoc, collection, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, getDocs,
  Timestamp, onAuthStateChanged, signOut
} from "./firebase-config.js";
import { getInitials, getCompanyTileColor } from "./job-ui-helpers.js";
import { setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { loadSiteSettings, DEFAULT_SETTINGS } from "./site-settings.js";

function tileHtml(name, size = "") {
  const tile = getCompanyTileColor(name);
  return `<div class="sala-company-tile ${size}" style="background:${tile.bg}; color:${tile.color};">${getInitials(name)}</div>`;
}

// ==========================================================================
// 0. GARDE D'ACCÈS ADMIN
// ==========================================================================
const dashboardShell = document.getElementById("dashboardShell");
const authCheckingEl = document.getElementById("authChecking");
const userStatusEl = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");
let currentAdminUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "connexion.html";
    return;
  }
  currentAdminUser = user;

  try {
    const roleDoc = await getDoc(doc(db, "roles", user.uid));
    const role = roleDoc.exists() ? roleDoc.data().role : null;

    if (role !== "admin") {
      alert("Accès refusé. Réservé aux administrateurs de l'ONG Sala.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    if (userStatusEl) userStatusEl.textContent = `Connecté : ${user.email}`;
    if (authCheckingEl) authCheckingEl.style.display = "none";
    if (dashboardShell) dashboardShell.style.display = "flex";

    initSectionNav();
    watchJobs();
    watchEvents();
    watchAnnuaire("universities");
    watchLegislation();
    watchUsers();

  } catch (error) {
    console.error("Erreur d'authentification admin :", error);
    alert("Erreur lors de la vérification de vos droits administrateur.");
    window.location.href = "index.html";
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
    }
  });
}

function notify(title, icon = "success") {
  if (typeof Swal !== "undefined") {
    Swal.fire({ title, icon, showConfirmButton: false, timer: 1600 });
  } else {
    alert(title);
  }
}

async function confirmDelete(label) {
  if (typeof Swal !== "undefined") {
    const result = await Swal.fire({
      title: "Supprimer ?",
      text: `« ${label} » sera définitivement supprimé.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#e30613"
    });
    return result.isConfirmed;
  }
  return confirm(`Supprimer « ${label} » ?`);
}

// ==========================================================================
// 1. NAVIGATION ENTRE SECTIONS
// ==========================================================================
const SECTION_META = {
  overview: { title: "Vue d'ensemble", subtitle: "Un coup d'œil sur l'activité de la plateforme" },
  jobs: { title: "Offres d'emploi", subtitle: "Publiez, modifiez ou masquez les offres visibles sur le site." },
  events: { title: "Événements", subtitle: "Salons, ateliers et webinaires affichés sur la page Événements." },
  annuaire: { title: "Annuaires Sala", subtitle: "Universités, entreprises partenaires et clubs d'anglais." },
  legislation: { title: "Droit du Travail", subtitle: "Fiches thématiques affichées sur la page Législation." },
  users: { title: "Utilisateurs", subtitle: "Comptes candidats inscrits. Promouvoir un compte donne accès à ce tableau de bord." },
  settings: { title: "Paramètres", subtitle: "Votre compte administrateur et les réglages généraux du site." }
};

function goToSection(target) {
  // Toutes les représentations du lien (sidebar bureau + onglets mobile) restent synchronisées
  document.querySelectorAll("[data-section]").forEach(l => l.classList.toggle("active", l.dataset.section === target));
  document.querySelectorAll(".admin-section").forEach(s => s.classList.toggle("active", s.id === `section-${target}`));

  const meta = SECTION_META[target];
  if (meta) {
    const titleEl = document.getElementById("pageTitle");
    const subtitleEl = document.getElementById("pageSubtitle");
    if (titleEl) titleEl.textContent = meta.title;
    if (subtitleEl) subtitleEl.textContent = meta.subtitle;
  }

  if (target === "overview") renderOverview();
  if (target === "settings") renderSettingsSection();
}

function initSectionNav() {
  document.querySelectorAll("[data-section]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      goToSection(link.dataset.section);
    });
  });

  // Sous-onglets des annuaires
  document.querySelectorAll(".annuaire-subtab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".annuaire-subtab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const category = tab.dataset.category;
      document.getElementById("annuaireModalCategory").value = category;
      if (annuaireSearchInput) annuaireSearchInput.value = "";
      watchAnnuaire(category);
    });
  });

  // Actions rapides de la Vue d'ensemble
  document.getElementById("quickNewJob")?.addEventListener("click", () => {
    goToSection("jobs");
    openJobModal(null);
  });
  document.getElementById("quickNewEvent")?.addEventListener("click", () => {
    goToSection("events");
    openEventModal(null);
  });
  document.getElementById("quickNewAnnuaire")?.addEventListener("click", () => {
    goToSection("annuaire");
    openAnnuaireModal("universities", null);
  });
  document.getElementById("quickNewLegislation")?.addEventListener("click", () => {
    goToSection("legislation");
    openLegislationModal(null);
  });

  renderOverview();
}

// ==========================================================================
// 1bis. VUE D'ENSEMBLE — statistiques
// ==========================================================================
async function renderOverview() {
  const now = new Date();

  const visibleJobs = jobsCache.filter(j => {
    const deadline = j.deadline?.toDate ? j.deadline.toDate() : null;
    return j.visibility !== false && (!deadline || deadline > now);
  });

  const statJobsVisible = document.getElementById("statJobsVisible");
  const statJobsTotal = document.getElementById("statJobsTotal");
  const statEvents = document.getElementById("statEvents");
  const statAnnuaire = document.getElementById("statAnnuaire");
  const statLegislation = document.getElementById("statLegislation");
  const statUsers = document.getElementById("statUsers");

  if (statJobsVisible) statJobsVisible.textContent = visibleJobs.length;
  if (statJobsTotal) statJobsTotal.textContent = jobsCache.length;
  if (statEvents) statEvents.textContent = eventsCache.length;
  if (statLegislation) statLegislation.textContent = legislationCache.length;
  if (statUsers) statUsers.textContent = usersCache.length;

  if (statAnnuaire) {
    try {
      const [uniSnap, compSnap, clubSnap] = await Promise.all([
        getDocs(collection(db, "universites")),
        getDocs(collection(db, "entreprises")),
        getDocs(collection(db, "clubs_anglais"))
      ]);
      statAnnuaire.textContent = uniSnap.size + compSnap.size + clubSnap.size;
    } catch (err) {
      console.error("Erreur comptage annuaires :", err);
      statAnnuaire.textContent = "—";
    }
  }
}

function dateInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ==========================================================================
// 2. OFFRES D'EMPLOI (collection "emplois")
// ==========================================================================
const jobsGrid = document.getElementById("jobsGrid");
const jobsSearchInput = document.getElementById("jobsSearchInput");
const jobModalEl = document.getElementById("jobModal");
const jobModal = jobModalEl ? new bootstrap.Modal(jobModalEl) : null;
const jobForm = document.getElementById("jobForm");
let jobsCache = [];

function watchJobs() {
  // Pas de orderBy() : Firestore exclurait silencieusement du résultat toute offre
  // sans champ "timestamp" (utile ici justement pour repérer ce genre d'offres).
  const q = collection(db, "emplois");
  onSnapshot(q, (snapshot) => {
    jobsCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    jobsCache.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
    renderJobsGrid();
    if (document.getElementById("section-overview")?.classList.contains("active")) renderOverview();
  }, (err) => console.error("Erreur chargement offres :", err));
}

jobsSearchInput?.addEventListener("input", renderJobsGrid);

function renderJobsGrid() {
  if (!jobsGrid) return;
  const term = (jobsSearchInput?.value || "").trim().toLowerCase();
  const filtered = jobsCache.filter(job =>
    !term || [job.title, job.company, job.city].some(v => (v || "").toLowerCase().includes(term))
  );

  if (filtered.length === 0) {
    jobsGrid.innerHTML = `<div class="admin-card-empty admin-empty">${jobsCache.length === 0 ? "Aucune offre publiée pour le moment." : "Aucune offre ne correspond à votre recherche."}</div>`;
    return;
  }

  jobsGrid.innerHTML = filtered.map(job => {
    const deadline = job.deadline?.toDate ? job.deadline.toDate().toLocaleDateString('fr-FR') : "Sans échéance";
    return `
      <div class="admin-card">
        <div class="admin-card-top">
          <div class="admin-row-identity">
            ${tileHtml(job.company)}
            <div>
              <div class="title">${job.title || "Offre sans titre"}</div>
              <div class="subtitle">${job.company || "Entreprise non précisée"}</div>
            </div>
          </div>
          <label class="admin-switch" title="Visible publiquement">
            <input type="checkbox" class="job-visibility-toggle" data-id="${job.id}" ${job.visibility ? "checked" : ""}>
            <span></span>
          </label>
        </div>
        <div class="admin-card-meta">
          <span><i class="fas fa-map-marker-alt"></i>${job.city || "—"}</span>
          <span class="admin-badge">${job.contract || "—"}</span>
          <span><i class="far fa-clock"></i>${deadline}</span>
        </div>
        <div class="admin-card-footer">
          <span class="text-muted small">${job.visibility ? "Publiée" : "Masquée"}</span>
          <div class="admin-actions">
            <button class="btn-icon btn-icon-edit job-edit-btn" data-id="${job.id}" title="Modifier"><i class="fas fa-pen"></i></button>
            <button class="btn-icon btn-icon-delete job-delete-btn" data-id="${job.id}" title="Supprimer"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  jobsGrid.querySelectorAll(".job-visibility-toggle").forEach(el => {
    el.addEventListener("change", async () => {
      try {
        await updateDoc(doc(db, "emplois", el.dataset.id), { visibility: el.checked });
      } catch (err) {
        console.error("Erreur mise à jour visibilité :", err);
        notify("Impossible de mettre à jour la visibilité.", "error");
      }
    });
  });

  jobsGrid.querySelectorAll(".job-edit-btn").forEach(el => {
    el.addEventListener("click", () => openJobModal(jobsCache.find(j => j.id === el.dataset.id)));
  });

  jobsGrid.querySelectorAll(".job-delete-btn").forEach(el => {
    el.addEventListener("click", async () => {
      const job = jobsCache.find(j => j.id === el.dataset.id);
      if (!job) return;
      if (await confirmDelete(job.title || "cette offre")) {
        try {
          await deleteDoc(doc(db, "emplois", job.id));
          notify("Offre supprimée.");
        } catch (err) {
          console.error("Erreur suppression offre :", err);
          notify("Erreur lors de la suppression.", "error");
        }
      }
    });
  });
}

function openJobModal(job = null) {
  jobForm.reset();
  document.getElementById("jobEditId").value = job ? job.id : "";
  document.getElementById("jobModalTitle").textContent = job ? "Modifier l'offre" : "Publier une nouvelle offre";

  document.getElementById("title").value = job?.title || "";
  document.getElementById("company").value = job?.company || "";
  document.getElementById("city").value = job?.city || "";
  document.getElementById("contract").value = job?.contract || "";
  document.getElementById("jobEmail").value = job?.email || "";
  document.getElementById("site").value = job?.site || "";
  document.getElementById("tel").value = job?.tel || "";
  document.getElementById("image").value = job?.image || "";
  document.getElementById("body").value = job?.body || "";
  document.getElementById("languages").value = job?.languages || "";
  document.getElementById("competences").value = (job?.competences || []).join(", ");
  document.getElementById("visibility").checked = job ? !!job.visibility : true;

  document.getElementById("timestamp").value = job?.timestamp?.toDate ? dateInputValue(job.timestamp.toDate()) : dateInputValue(new Date());
  document.getElementById("deadline").value = job?.deadline?.toDate ? dateInputValue(job.deadline.toDate()) : "";

  jobModal.show();
}

document.getElementById("btnNewJob")?.addEventListener("click", () => openJobModal(null));

jobForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const editId = document.getElementById("jobEditId").value;
  const timestampInput = document.getElementById("timestamp").value;
  const deadlineInput = document.getElementById("deadline").value;

  const jobData = {
    title: document.getElementById("title").value.trim(),
    company: document.getElementById("company").value.trim(),
    city: document.getElementById("city").value.trim(),
    email: document.getElementById("jobEmail").value.trim(),
    contract: document.getElementById("contract").value,
    timestamp: timestampInput ? Timestamp.fromDate(new Date(timestampInput)) : Timestamp.now(),
    deadline: deadlineInput ? Timestamp.fromDate(new Date(deadlineInput)) : Timestamp.now(),
    body: document.getElementById("body").value.trim(),
    languages: document.getElementById("languages").value.trim() || null,
    competences: document.getElementById("competences").value.split(",").map(s => s.trim()).filter(Boolean),
    visibility: document.getElementById("visibility").checked,
    site: document.getElementById("site").value.trim() || null,
    image: document.getElementById("image").value.trim() || null,
    tel: document.getElementById("tel").value.trim() || null
  };

  try {
    if (editId) {
      await updateDoc(doc(db, "emplois", editId), jobData);
      notify("Offre mise à jour.");
    } else {
      await addDoc(collection(db, "emplois"), jobData);
      notify("Offre publiée avec succès !");
    }
    jobModal.hide();
  } catch (err) {
    console.error("Erreur publication offre :", err);
    notify("Erreur : " + err.message, "error");
  }
});

// ==========================================================================
// 3. ÉVÉNEMENTS (collection "evenements")
// ==========================================================================
const eventsGrid = document.getElementById("eventsGrid");
const eventsSearchInput = document.getElementById("eventsSearchInput");
const eventModalEl = document.getElementById("eventModal");
const eventModal = eventModalEl ? new bootstrap.Modal(eventModalEl) : null;
const eventForm = document.getElementById("eventForm");
const registrationsModalEl = document.getElementById("registrationsModal");
const registrationsModal = registrationsModalEl ? new bootstrap.Modal(registrationsModalEl) : null;
let eventsCache = [];

function watchEvents() {
  const q = query(collection(db, "evenements"), orderBy("isoDate", "asc"));
  onSnapshot(q, (snapshot) => {
    eventsCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderEventsGrid();
    if (document.getElementById("section-overview")?.classList.contains("active")) renderOverview();
  }, (err) => console.error("Erreur chargement événements :", err));
}

eventsSearchInput?.addEventListener("input", renderEventsGrid);

function renderEventsGrid() {
  if (!eventsGrid) return;
  const term = (eventsSearchInput?.value || "").trim().toLowerCase();
  const filtered = eventsCache.filter(evt =>
    !term || [evt.title, evt.organizer, evt.city].some(v => (v || "").toLowerCase().includes(term))
  );

  if (filtered.length === 0) {
    eventsGrid.innerHTML = `<div class="admin-card-empty admin-empty">${eventsCache.length === 0 ? "Aucun événement publié pour le moment." : "Aucun événement ne correspond à votre recherche."}</div>`;
    return;
  }

  eventsGrid.innerHTML = filtered.map(evt => `
    <div class="admin-card">
      <div class="admin-card-top">
        <div class="admin-row-identity">
          ${tileHtml(evt.organizer || evt.title)}
          <div>
            <div class="title">${evt.title || "Événement sans titre"}</div>
            <div class="subtitle">${evt.organizer || "Organisateur non précisé"}</div>
          </div>
        </div>
      </div>
      <div class="admin-card-meta">
        <span class="admin-badge">${evt.category || "—"}</span>
        <span><i class="far fa-calendar"></i>${evt.date || "—"}</span>
        <span><i class="fas fa-map-marker-alt"></i>${evt.city || "—"}</span>
      </div>
      <div class="admin-card-footer">
        <span class="text-muted small">${evt.location || ""}</span>
        <div class="admin-actions">
          <button class="btn-icon event-registrations-btn" data-id="${evt.id}" data-title="${(evt.title || "").replace(/"/g, '&quot;')}" title="Voir les inscriptions"><i class="fas fa-users"></i></button>
          <button class="btn-icon btn-icon-edit event-edit-btn" data-id="${evt.id}" title="Modifier"><i class="fas fa-pen"></i></button>
          <button class="btn-icon btn-icon-delete event-delete-btn" data-id="${evt.id}" title="Supprimer"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join("");

  eventsGrid.querySelectorAll(".event-edit-btn").forEach(el => {
    el.addEventListener("click", () => openEventModal(eventsCache.find(ev => ev.id === el.dataset.id)));
  });

  eventsGrid.querySelectorAll(".event-delete-btn").forEach(el => {
    el.addEventListener("click", async () => {
      const evt = eventsCache.find(ev => ev.id === el.dataset.id);
      if (!evt) return;
      if (await confirmDelete(evt.title || "cet événement")) {
        try {
          await deleteDoc(doc(db, "evenements", evt.id));
          notify("Événement supprimé.");
        } catch (err) {
          console.error("Erreur suppression événement :", err);
          notify("Erreur lors de la suppression.", "error");
        }
      }
    });
  });

  eventsGrid.querySelectorAll(".event-registrations-btn").forEach(el => {
    el.addEventListener("click", () => showRegistrations(el.dataset.id, el.dataset.title));
  });
}

async function showRegistrations(eventId, eventTitle) {
  const body = document.getElementById("registrationsModalBody");
  document.getElementById("registrationsModalTitle").textContent = `Inscrits — ${eventTitle}`;
  body.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-success"></div></div>`;
  registrationsModal.show();

  try {
    const q = query(collection(db, "inscriptions_evenements"), where("eventId", "==", eventId));
    const snap = await getDocs(q);
    if (snap.empty) {
      body.innerHTML = `<p class="admin-empty">Aucune inscription pour cet événement pour le moment.</p>`;
      return;
    }
    body.innerHTML = `
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th></tr></thead>
          <tbody>
            ${snap.docs.map(d => {
              const r = d.data();
              return `<tr><td>${r.name || ""}</td><td>${r.email || ""}</td><td>${r.phone || ""}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <p class="text-muted small mb-0">${snap.size} inscription(s) au total.</p>
    `;
  } catch (err) {
    console.error("Erreur chargement inscriptions :", err);
    body.innerHTML = `<p class="text-danger small">Impossible de charger les inscriptions.</p>`;
  }
}

function openEventModal(evt = null) {
  eventForm.reset();
  document.getElementById("eventEditId").value = evt ? evt.id : "";
  document.getElementById("eventModalTitle").textContent = evt ? "Modifier l'événement" : "Ajouter un événement";

  document.getElementById("eventTitle").value = evt?.title || "";
  document.getElementById("eventCategory").value = evt?.category || "Salon";
  document.getElementById("eventOrganizer").value = evt?.organizer || "";
  document.getElementById("eventDateDisplay").value = evt?.date || "";
  document.getElementById("eventIsoDate").value = evt?.isoDate ? evt.isoDate.slice(0, 16) : "";
  document.getElementById("eventTime").value = evt?.time || "";
  document.getElementById("eventCity").value = evt?.city || "";
  document.getElementById("eventLocation").value = evt?.location || "";
  document.getElementById("eventPrice").value = evt?.price || "";
  document.getElementById("eventBadgeColor").value = evt?.badgeColor || "success";
  document.getElementById("eventDescription").value = evt?.description || "";
  document.getElementById("eventHighlights").value = (evt?.highlights || []).join(", ");
  document.getElementById("eventRegistrationRequired").checked = evt ? !!evt.registrationRequired : true;

  eventModal.show();
}

document.getElementById("btnNewEvent")?.addEventListener("click", () => openEventModal(null));

eventForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const editId = document.getElementById("eventEditId").value;
  const isoInput = document.getElementById("eventIsoDate").value;

  const eventData = {
    title: document.getElementById("eventTitle").value.trim(),
    category: document.getElementById("eventCategory").value,
    organizer: document.getElementById("eventOrganizer").value.trim(),
    date: document.getElementById("eventDateDisplay").value.trim(),
    isoDate: isoInput ? `${isoInput}:00` : "",
    time: document.getElementById("eventTime").value.trim(),
    city: document.getElementById("eventCity").value.trim(),
    location: document.getElementById("eventLocation").value.trim(),
    price: document.getElementById("eventPrice").value.trim(),
    badgeColor: document.getElementById("eventBadgeColor").value,
    description: document.getElementById("eventDescription").value.trim(),
    highlights: document.getElementById("eventHighlights").value.split(",").map(s => s.trim()).filter(Boolean),
    registrationRequired: document.getElementById("eventRegistrationRequired").checked
  };

  try {
    if (editId) {
      await updateDoc(doc(db, "evenements", editId), eventData);
      notify("Événement mis à jour.");
    } else {
      await addDoc(collection(db, "evenements"), eventData);
      notify("Événement ajouté avec succès !");
    }
    eventModal.hide();
  } catch (err) {
    console.error("Erreur publication événement :", err);
    notify("Erreur : " + err.message, "error");
  }
});

// ==========================================================================
// 4. ANNUAIRES : UNIVERSITÉS / ENTREPRISES / CLUBS D'ANGLAIS
// ==========================================================================
const ANNUAIRE_COLLECTIONS = {
  universities: "universites",
  companies: "entreprises",
  clubs: "clubs_anglais"
};

const annuaireGrid = document.getElementById("annuaireGrid");
const annuaireSearchInput = document.getElementById("annuaireSearchInput");
const annuaireModalEl = document.getElementById("annuaireModal");
const annuaireModal = annuaireModalEl ? new bootstrap.Modal(annuaireModalEl) : null;
const annuaireForm = document.getElementById("annuaireForm");
let annuaireCache = [];
let annuaireUnsub = null;
let annuaireActiveCategory = "universities";

function watchAnnuaire(category) {
  annuaireActiveCategory = category;
  if (annuaireUnsub) annuaireUnsub();
  const colName = ANNUAIRE_COLLECTIONS[category];
  annuaireUnsub = onSnapshot(collection(db, colName), (snapshot) => {
    annuaireCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAnnuaireGrid(category);
  }, (err) => console.error(`Erreur chargement ${colName} :`, err));
}

annuaireSearchInput?.addEventListener("input", () => renderAnnuaireGrid(annuaireActiveCategory));

function annuaireCardMeta(category, item) {
  if (category === "universities") {
    return `<span class="admin-badge">${item.type || "—"}</span><span><i class="fas fa-map-marker-alt"></i>${item.city || "—"}</span>`;
  }
  if (category === "companies") {
    return `<span class="admin-badge">${item.sector || "—"}</span><span><i class="fas fa-map-marker-alt"></i>${item.city || "—"}</span>`;
  }
  return `<span><i class="fas fa-map-marker-alt"></i>${item.city || "—"}</span><span><i class="far fa-clock"></i>${item.schedule || "—"}</span>`;
}

function annuaireCardFooter(category, item) {
  if (category === "universities") return item.phone || item.email || "";
  if (category === "companies") return item.email || item.phone || "";
  return item.coordinator || "";
}

function renderAnnuaireGrid(category) {
  if (!annuaireGrid) return;
  const term = (annuaireSearchInput?.value || "").trim().toLowerCase();
  const filtered = annuaireCache.filter(item =>
    !term || [item.name, item.city].some(v => (v || "").toLowerCase().includes(term))
  );

  if (filtered.length === 0) {
    annuaireGrid.innerHTML = `<div class="admin-card-empty admin-empty">${annuaireCache.length === 0 ? "Aucune fiche enregistrée dans cet annuaire." : "Aucune fiche ne correspond à votre recherche."}</div>`;
    return;
  }

  annuaireGrid.innerHTML = filtered.map(item => `
    <div class="admin-card">
      <div class="admin-card-top">
        <div class="admin-row-identity">
          ${tileHtml(item.name)}
          <div class="title">${item.name || "Sans nom"}</div>
        </div>
      </div>
      <div class="admin-card-meta">${annuaireCardMeta(category, item)}</div>
      <div class="admin-card-footer">
        <span class="text-muted small">${annuaireCardFooter(category, item)}</span>
        <div class="admin-actions">
          <button class="btn-icon btn-icon-edit annuaire-edit-btn" data-id="${item.id}" title="Modifier"><i class="fas fa-pen"></i></button>
          <button class="btn-icon btn-icon-delete annuaire-delete-btn" data-id="${item.id}" title="Supprimer"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join("");

  annuaireGrid.querySelectorAll(".annuaire-edit-btn").forEach(el => {
    el.addEventListener("click", () => openAnnuaireModal(category, annuaireCache.find(a => a.id === el.dataset.id)));
  });

  annuaireGrid.querySelectorAll(".annuaire-delete-btn").forEach(el => {
    el.addEventListener("click", async () => {
      const item = annuaireCache.find(a => a.id === el.dataset.id);
      if (!item) return;
      if (await confirmDelete(item.name || "cette fiche")) {
        try {
          await deleteDoc(doc(db, ANNUAIRE_COLLECTIONS[category], item.id));
          notify("Fiche supprimée.");
        } catch (err) {
          console.error("Erreur suppression fiche :", err);
          notify("Erreur lors de la suppression.", "error");
        }
      }
    });
  });
}

function annuaireFieldsHtml(category, item) {
  if (category === "universities") {
    return `
      <div class="form-grid">
        <div class="form-group"><label>Nom</label><input type="text" id="af_name" value="${item?.name || ""}" required></div>
        <div class="form-group"><label>Type</label><input type="text" id="af_type" value="${item?.type || ""}" placeholder="Université Publique, Institut Supérieur..."></div>
        <div class="form-group"><label>Ville</label><input type="text" id="af_city" value="${item?.city || ""}" required></div>
        <div class="form-group"><label>Adresse</label><input type="text" id="af_address" value="${item?.address || ""}"></div>
        <div class="form-group"><label>Téléphone</label><input type="text" id="af_phone" value="${item?.phone || ""}"></div>
        <div class="form-group"><label>Email</label><input type="email" id="af_email" value="${item?.email || ""}"></div>
        <div class="form-group"><label>Site Web</label><input type="url" id="af_website" value="${item?.website || ""}"></div>
      </div>
      <div class="form-group full-width">
        <label>Filières & Départements (séparés par des virgules)</label>
        <input type="text" id="af_faculties" value="${(item?.faculties || []).join(", ")}">
      </div>
    `;
  }
  if (category === "companies") {
    return `
      <div class="form-grid">
        <div class="form-group"><label>Nom</label><input type="text" id="af_name" value="${item?.name || ""}" required></div>
        <div class="form-group"><label>Secteur</label><input type="text" id="af_sector" value="${item?.sector || ""}" required></div>
        <div class="form-group"><label>Ville</label><input type="text" id="af_city" value="${item?.city || ""}" required></div>
        <div class="form-group"><label>Adresse</label><input type="text" id="af_address" value="${item?.address || ""}"></div>
        <div class="form-group"><label>Téléphone</label><input type="text" id="af_phone" value="${item?.phone || ""}"></div>
        <div class="form-group"><label>Email RH</label><input type="email" id="af_email" value="${item?.email || ""}"></div>
        <div class="form-group"><label>Site Web</label><input type="url" id="af_website" value="${item?.website || ""}"></div>
      </div>
      <div class="form-group full-width">
        <label>Description</label>
        <textarea id="af_description" rows="3">${item?.description || ""}</textarea>
      </div>
    `;
  }
  // clubs
  return `
    <div class="form-grid">
      <div class="form-group"><label>Nom</label><input type="text" id="af_name" value="${item?.name || ""}" required></div>
      <div class="form-group"><label>Ville</label><input type="text" id="af_city" value="${item?.city || ""}" required></div>
      <div class="form-group"><label>Lieu</label><input type="text" id="af_location" value="${item?.location || ""}"></div>
      <div class="form-group"><label>Horaire</label><input type="text" id="af_schedule" value="${item?.schedule || ""}" placeholder="Chaque samedi de 15h00 à 17h30"></div>
      <div class="form-group"><label>Coordinateur</label><input type="text" id="af_coordinator" value="${item?.coordinator || ""}"></div>
      <div class="form-group"><label>Téléphone</label><input type="text" id="af_phone" value="${item?.phone || ""}"></div>
      <div class="form-group"><label>Tarif</label><input type="text" id="af_fee" value="${item?.fee || ""}" placeholder="Gratuit, Adhésion libre..."></div>
    </div>
    <div class="form-group full-width">
      <label>Description</label>
      <textarea id="af_description" rows="3">${item?.description || ""}</textarea>
    </div>
  `;
}

function openAnnuaireModal(category, item = null) {
  document.getElementById("annuaireModalCategory").value = category;
  document.getElementById("annuaireEditId").value = item ? item.id : "";

  const labels = { universities: "une université/école", companies: "une entreprise", clubs: "un club d'anglais" };
  document.getElementById("annuaireModalTitle").textContent = item ? "Modifier la fiche" : `Ajouter ${labels[category]}`;

  document.getElementById("annuaireFormFields").innerHTML = annuaireFieldsHtml(category, item);
  annuaireModal.show();
}

document.getElementById("btnNewAnnuaire")?.addEventListener("click", () => {
  const activeTab = document.querySelector(".annuaire-subtab.active");
  openAnnuaireModal(activeTab ? activeTab.dataset.category : "universities", null);
});

annuaireForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const category = document.getElementById("annuaireModalCategory").value;
  const editId = document.getElementById("annuaireEditId").value;
  const colName = ANNUAIRE_COLLECTIONS[category];

  const val = (id) => document.getElementById(id)?.value?.trim() || "";
  let data;

  if (category === "universities") {
    data = {
      name: val("af_name"), type: val("af_type"), city: val("af_city"), address: val("af_address"),
      phone: val("af_phone"), email: val("af_email"), website: val("af_website"),
      faculties: val("af_faculties").split(",").map(s => s.trim()).filter(Boolean)
    };
  } else if (category === "companies") {
    data = {
      name: val("af_name"), sector: val("af_sector"), city: val("af_city"), address: val("af_address"),
      phone: val("af_phone"), email: val("af_email"), website: val("af_website"), description: val("af_description")
    };
  } else {
    data = {
      name: val("af_name"), city: val("af_city"), location: val("af_location"), schedule: val("af_schedule"),
      coordinator: val("af_coordinator"), phone: val("af_phone"), fee: val("af_fee"), description: val("af_description")
    };
  }

  try {
    if (editId) {
      await updateDoc(doc(db, colName, editId), data);
      notify("Fiche mise à jour.");
    } else {
      await addDoc(collection(db, colName), data);
      notify("Fiche ajoutée avec succès !");
    }
    annuaireModal.hide();
  } catch (err) {
    console.error("Erreur enregistrement fiche :", err);
    notify("Erreur : " + err.message, "error");
  }
});

// ==========================================================================
// 5. DROIT DU TRAVAIL (collection "legislation")
// ==========================================================================
const legislationGrid = document.getElementById("legislationGrid");
const legislationSearchInput = document.getElementById("legislationSearchInput");
const legislationModalEl = document.getElementById("legislationModal");
const legislationModal = legislationModalEl ? new bootstrap.Modal(legislationModalEl) : null;
const legislationForm = document.getElementById("legislationForm");
let legislationCache = [];

const TOPIC_LABELS = {
  contrat: "Contrat de Travail",
  salaire: "Rémunération",
  horaires: "Temps de Travail",
  conges: "Congés & Repos",
  rupture: "Fin de Contrat"
};

function watchLegislation() {
  const q = collection(db, "legislation");
  onSnapshot(q, (snapshot) => {
    legislationCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    legislationCache.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderLegislationGrid();
    if (document.getElementById("section-overview")?.classList.contains("active")) renderOverview();
  }, (err) => console.error("Erreur chargement législation :", err));
}

legislationSearchInput?.addEventListener("input", renderLegislationGrid);

function renderLegislationGrid() {
  if (!legislationGrid) return;
  const term = (legislationSearchInput?.value || "").trim().toLowerCase();
  const filtered = legislationCache.filter(fiche =>
    !term || [fiche.title, fiche.topicLabel].some(v => (v || "").toLowerCase().includes(term))
  );

  if (legislationCache.length === 0) {
    legislationGrid.innerHTML = `
      <div class="admin-card-empty admin-empty">
        Aucune fiche personnalisée pour le moment — la page Législation affiche actuellement le guide intégré par défaut.
        Ajoutez une fiche ici pour commencer à le personnaliser.
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    legislationGrid.innerHTML = `<div class="admin-card-empty admin-empty">Aucune fiche ne correspond à votre recherche.</div>`;
    return;
  }

  legislationGrid.innerHTML = filtered.map(fiche => `
    <div class="admin-card">
      <div class="admin-card-top">
        <div class="admin-row-identity">
          ${tileHtml(fiche.title)}
          <div>
            <div class="title">${fiche.title || "Sans titre"}</div>
            <div class="subtitle">${fiche.articleRef || ""}</div>
          </div>
        </div>
      </div>
      <div class="admin-card-meta">
        <span class="admin-badge">${fiche.topicLabel || TOPIC_LABELS[fiche.topic] || fiche.topic || "—"}</span>
        ${fiche.faqQuestion ? `<span><i class="fas fa-question-circle"></i>FAQ incluse</span>` : ""}
      </div>
      <div class="admin-card-footer">
        <span class="text-muted small">Ordre : ${fiche.order ?? "—"}</span>
        <div class="admin-actions">
          <button class="btn-icon btn-icon-edit leg-edit-btn" data-id="${fiche.id}" title="Modifier"><i class="fas fa-pen"></i></button>
          <button class="btn-icon btn-icon-delete leg-delete-btn" data-id="${fiche.id}" title="Supprimer"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join("");

  legislationGrid.querySelectorAll(".leg-edit-btn").forEach(el => {
    el.addEventListener("click", () => openLegislationModal(legislationCache.find(f => f.id === el.dataset.id)));
  });

  legislationGrid.querySelectorAll(".leg-delete-btn").forEach(el => {
    el.addEventListener("click", async () => {
      const fiche = legislationCache.find(f => f.id === el.dataset.id);
      if (!fiche) return;
      if (await confirmDelete(fiche.title || "cette fiche")) {
        try {
          await deleteDoc(doc(db, "legislation", fiche.id));
          notify("Fiche supprimée.");
        } catch (err) {
          console.error("Erreur suppression fiche législation :", err);
          notify("Erreur lors de la suppression.", "error");
        }
      }
    });
  });
}

function openLegislationModal(fiche = null) {
  legislationForm.reset();
  document.getElementById("legislationEditId").value = fiche ? fiche.id : "";
  document.getElementById("legislationModalTitle").textContent = fiche ? "Modifier la fiche" : "Ajouter une fiche";

  document.getElementById("legTopic").value = fiche?.topic || "contrat";
  document.getElementById("legTopicLabel").value = fiche?.topicLabel || "";
  document.getElementById("legArticleRef").value = fiche?.articleRef || "";
  document.getElementById("legOrder").value = fiche?.order || (legislationCache.length + 1);
  document.getElementById("legTitle").value = fiche?.title || "";
  document.getElementById("legIntro").value = fiche?.intro || "";
  document.getElementById("legBody").value = fiche?.bodyHtml || "";
  document.getElementById("legFaqQuestion").value = fiche?.faqQuestion || "";
  document.getElementById("legFaqAnswer").value = fiche?.faqAnswer || "";

  legislationModal.show();
}

document.getElementById("btnNewLegislation")?.addEventListener("click", () => openLegislationModal(null));

legislationForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const editId = document.getElementById("legislationEditId").value;

  const data = {
    topic: document.getElementById("legTopic").value,
    topicLabel: document.getElementById("legTopicLabel").value.trim(),
    articleRef: document.getElementById("legArticleRef").value.trim(),
    order: parseInt(document.getElementById("legOrder").value, 10) || 1,
    title: document.getElementById("legTitle").value.trim(),
    intro: document.getElementById("legIntro").value.trim(),
    bodyHtml: document.getElementById("legBody").value.trim(),
    faqQuestion: document.getElementById("legFaqQuestion").value.trim(),
    faqAnswer: document.getElementById("legFaqAnswer").value.trim()
  };

  try {
    if (editId) {
      await updateDoc(doc(db, "legislation", editId), data);
      notify("Fiche mise à jour.");
    } else {
      await addDoc(collection(db, "legislation"), data);
      notify("Fiche ajoutée avec succès !");
    }
    legislationModal.hide();
  } catch (err) {
    console.error("Erreur enregistrement fiche législation :", err);
    notify("Erreur : " + err.message, "error");
  }
});

// ==========================================================================
// 6. UTILISATEURS (collection "users" + rôles admin dans "roles")
// ==========================================================================
const usersGrid = document.getElementById("usersGrid");
const usersSearchInput = document.getElementById("usersSearchInput");
let usersCache = [];
let adminUidSet = new Set();

async function watchUsers() {
  try {
    const [usersSnap, rolesSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "roles"))
    ]);

    usersCache = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    adminUidSet = new Set(
      rolesSnap.docs.filter(d => d.data().role === "admin").map(d => d.id)
    );

    renderUsersGrid();
    if (document.getElementById("section-overview")?.classList.contains("active")) renderOverview();
  } catch (err) {
    console.error("Erreur chargement utilisateurs :", err);
    if (usersGrid) usersGrid.innerHTML = `<div class="admin-card-empty admin-empty">Impossible de charger les utilisateurs.</div>`;
  }
}

usersSearchInput?.addEventListener("input", renderUsersGrid);

function renderUsersGrid() {
  if (!usersGrid) return;
  const term = (usersSearchInput?.value || "").trim().toLowerCase();
  const filtered = usersCache.filter(u =>
    !term || [u.fullName, u.email, u.city].some(v => (v || "").toLowerCase().includes(term))
  );

  if (filtered.length === 0) {
    usersGrid.innerHTML = `<div class="admin-card-empty admin-empty">${usersCache.length === 0 ? "Aucun compte candidat inscrit pour le moment." : "Aucun utilisateur ne correspond à votre recherche."}</div>`;
    return;
  }

  usersGrid.innerHTML = filtered.map(u => {
    const isAdmin = adminUidSet.has(u.id);
    const joined = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('fr-FR') : "—";
    return `
      <div class="admin-card">
        <div class="admin-card-top">
          <div class="admin-row-identity">
            ${tileHtml(u.fullName || u.email)}
            <div>
              <div class="title">${u.fullName || "Candidat Sala"}</div>
              <div class="subtitle">${u.email || ""}</div>
            </div>
          </div>
          ${isAdmin ? `<span class="admin-badge" style="background:var(--sala-red-light); color:var(--sala-red);">Admin</span>` : ""}
        </div>
        <div class="admin-card-meta">
          <span><i class="fas fa-map-marker-alt"></i>${u.city || "—"}</span>
          <span><i class="far fa-calendar"></i>Inscrit le ${joined}</span>
        </div>
        <div class="admin-card-footer">
          <span class="text-muted small">${(u.skills || []).length} compétence(s)</span>
          <button class="btn-icon ${isAdmin ? "btn-icon-delete" : "btn-icon-edit"} user-toggle-admin-btn" data-id="${u.id}" data-admin="${isAdmin}" title="${isAdmin ? "Retirer les droits admin" : "Promouvoir en admin"}">
            <i class="fas ${isAdmin ? "fa-user-minus" : "fa-user-shield"}"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  usersGrid.querySelectorAll(".user-toggle-admin-btn").forEach(el => {
    el.addEventListener("click", async () => {
      const uid = el.dataset.id;
      const user = usersCache.find(u => u.id === uid);
      const isAdmin = el.dataset.admin === "true";
      const label = user?.fullName || user?.email || "cet utilisateur";

      const confirmMsg = isAdmin
        ? `Retirer les droits administrateur de « ${label} » ?`
        : `Donner les droits administrateur (accès complet à ce tableau de bord) à « ${label} » ?`;

      const result = typeof Swal !== "undefined"
        ? await Swal.fire({ title: "Confirmer", text: confirmMsg, icon: "warning", showCancelButton: true, confirmButtonText: "Confirmer", cancelButtonText: "Annuler", confirmButtonColor: isAdmin ? "#e30613" : "#3b9452" })
        : { isConfirmed: confirm(confirmMsg) };

      if (!result.isConfirmed) return;

      try {
        if (isAdmin) {
          await deleteDoc(doc(db, "roles", uid));
          adminUidSet.delete(uid);
          notify("Droits administrateur retirés.");
        } else {
          await setDoc(doc(db, "roles", uid), { role: "admin" });
          adminUidSet.add(uid);
          notify("Utilisateur promu administrateur.");
        }
        renderUsersGrid();
      } catch (err) {
        console.error("Erreur mise à jour du rôle :", err);
        notify("Erreur : " + err.message, "error");
      }
    });
  });
}

// ==========================================================================
// 7. PARAMÈTRES — compte administrateur & réglages du site
// ==========================================================================
const accountForm = document.getElementById("accountForm");
const passwordForm = document.getElementById("passwordForm");
const contactSettingsForm = document.getElementById("contactSettingsForm");
const visibilitySettingsForm = document.getElementById("visibilitySettingsForm");
let currentSiteSettings = DEFAULT_SETTINGS;

async function renderSettingsSection() {
  // Mon compte
  if (currentAdminUser) {
    document.getElementById("accountName").value = currentAdminUser.displayName || "";
    document.getElementById("accountPhoto").value = currentAdminUser.photoURL || "";
    document.getElementById("accountEmail").value = currentAdminUser.email || "";
  }

  // Réglages du site
  currentSiteSettings = await loadSiteSettings();
  document.getElementById("setContactEmail").value = currentSiteSettings.contactEmail;
  document.getElementById("setContactCities").value = currentSiteSettings.contactCities;
  document.getElementById("setFacebook").value = currentSiteSettings.socialFacebook || "";
  document.getElementById("setWhatsapp").value = currentSiteSettings.socialWhatsapp || "";
  document.getElementById("setInstagram").value = currentSiteSettings.socialInstagram || "";

  document.getElementById("visEvenements").checked = currentSiteSettings.sectionsVisible.evenements;
  document.getElementById("visAnnuaires").checked = currentSiteSettings.sectionsVisible.annuaires;
  document.getElementById("visEntretiens").checked = currentSiteSettings.sectionsVisible.entretiens;
  document.getElementById("visLegislation").checked = currentSiteSettings.sectionsVisible.legislation;
}

accountForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentAdminUser) return;
  try {
    await updateProfile(currentAdminUser, {
      displayName: document.getElementById("accountName").value.trim() || null,
      photoURL: document.getElementById("accountPhoto").value.trim() || null
    });
    if (userStatusEl) userStatusEl.textContent = `Connecté : ${currentAdminUser.email}`;
    notify("Profil mis à jour.");
  } catch (err) {
    console.error("Erreur mise à jour du profil :", err);
    notify("Erreur : " + err.message, "error");
  }
});

passwordForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentAdminUser) return;

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  try {
    const credential = EmailAuthProvider.credential(currentAdminUser.email, currentPassword);
    await reauthenticateWithCredential(currentAdminUser, credential);
    await updatePassword(currentAdminUser, newPassword);
    passwordForm.reset();
    notify("Mot de passe mis à jour.");
  } catch (err) {
    console.error("Erreur changement de mot de passe :", err);
    const message = err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
      ? "Mot de passe actuel incorrect."
      : "Erreur : " + err.message;
    notify(message, "error");
  }
});

contactSettingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    contactEmail: document.getElementById("setContactEmail").value.trim(),
    contactCities: document.getElementById("setContactCities").value.trim(),
    socialFacebook: document.getElementById("setFacebook").value.trim(),
    socialWhatsapp: document.getElementById("setWhatsapp").value.trim(),
    socialInstagram: document.getElementById("setInstagram").value.trim()
  };
  try {
    await setDoc(doc(db, "settings", "site"), data, { merge: true });
    notify("Coordonnées enregistrées.");
  } catch (err) {
    console.error("Erreur enregistrement des coordonnées :", err);
    notify("Erreur : " + err.message, "error");
  }
});

visibilitySettingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sectionsVisible = {
    evenements: document.getElementById("visEvenements").checked,
    annuaires: document.getElementById("visAnnuaires").checked,
    entretiens: document.getElementById("visEntretiens").checked,
    legislation: document.getElementById("visLegislation").checked
  };
  try {
    await setDoc(doc(db, "settings", "site"), { sectionsVisible }, { merge: true });
    notify("Visibilité enregistrée. Les visiteurs verront le changement à leur prochain chargement de page.");
  } catch (err) {
    console.error("Erreur enregistrement de la visibilité :", err);
    notify("Erreur : " + err.message, "error");
  }
});
