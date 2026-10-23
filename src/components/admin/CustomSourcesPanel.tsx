// src/components/admin/CustomSourcesPanel.tsx
// Admin > Imports : ajout de nouveaux sites à collecter sans développement.
// L'admin colle l'adresse de la page qui liste les offres, teste ce que le
// collecteur générique en tire, puis ajoute la source ; elle apparaît alors
// dans le choix des sources et, si cochée, dans la collecte quotidienne.

"use client";

import { useState, type FormEvent } from "react";
import { confirmDelete, notify } from "@/lib/notify";
import { testCustomSource, useCustomSources, type SourceTestResult } from "@/hooks/useCustomSources";

const METHOD_LABELS: Record<SourceTestResult["method"], string> = {
  rss: "flux RSS du site (méthode la plus fiable)",
  liens: "détection automatique des liens d'offres",
  selecteur: "liens désignés par le sélecteur avancé",
};

const EMPTY = { name: "", url: "", keyword: "", selector: "" };

export function CustomSourcesPanel() {
  const { sources, addSource, updateSource, removeSource } = useCustomSources();
  const [form, setForm] = useState(EMPTY);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState<SourceTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key !== "name") setTest(null); // un test ne vaut que pour la configuration testée
  }

  async function handleTest() {
    if (!form.url.trim()) return;
    setTesting(true);
    setTest(null);
    setTestError(null);
    try {
      setTest(await testCustomSource({ url: form.url.trim(), keyword: form.keyword.trim(), selector: form.selector.trim() }));
    } catch (err) {
      setTestError((err as Error).message);
    } finally {
      setTesting(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!test || test.jobs.length === 0) return;
    setSaving(true);
    try {
      await addSource({
        name: form.name.trim(),
        url: form.url.trim(),
        keyword: form.keyword.trim(),
        selector: form.selector.trim(),
        enabled: true,
      });
      notify("Source ajoutée. Choisissez-la dans « Source » puis lancez une collecte.");
      setForm(EMPTY);
      setTest(null);
    } catch (err) {
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="admin-panel mb-4">
      <summary style={{ cursor: "pointer" }}>
        <strong><i className="fas fa-plus-circle me-2"></i>Sources personnalisées</strong>
        <span className="text-muted small ms-2">
          Ajouter un site qui publie des offres au Congo ({sources.length} ajoutée{sources.length > 1 ? "s" : ""})
        </span>
      </summary>

      {sources.length > 0 && (
        <div className="mt-3" style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Collecte quotidienne</th>
                <th>Dernier passage</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="fw-semibold">{s.name}</div>
                    <div className="small text-muted text-break">{s.url}</div>
                  </td>
                  <td>
                    <label className="admin-switch" title="Inclure dans la collecte automatique de 6 h">
                      <input type="checkbox" checked={s.enabled} onChange={(e) => updateSource(s, { enabled: e.target.checked })} />
                      <span></span>
                    </label>
                  </td>
                  <td className="small">
                    {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString("fr-FR") : "—"}
                    {s.lastError ? (
                      <div className="text-danger" title={s.lastError}><i className="fas fa-exclamation-triangle me-1"></i>Échec</div>
                    ) : s.lastRunAt ? (
                      <div className="text-muted">{s.lastCount ?? 0} offre(s) trouvée(s)</div>
                    ) : null}
                  </td>
                  <td>
                    <button
                      className="btn-icon btn-icon-delete"
                      title="Supprimer la source"
                      onClick={async () => {
                        if (await confirmDelete(s.name)) await removeSource(s);
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="job-form mt-3" onSubmit={handleAdd}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="srcName">Nom de la source</label>
            <input id="srcName" type="text" placeholder="Ex : Emploi Congo Info" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} />
          </div>
          <div className="form-group">
            <label htmlFor="srcUrl">Adresse de la page des offres (ou de son flux RSS)</label>
            <input id="srcUrl" type="url" placeholder="https://..." value={form.url} onChange={(e) => set("url", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="srcKeyword">Ne garder que les offres contenant (facultatif)</label>
            <input id="srcKeyword" type="text" placeholder="Ex : Congo, Brazzaville" value={form.keyword} onChange={(e) => set("keyword", e.target.value)} maxLength={60} />
          </div>
        </div>

        <button type="button" className="btn btn-link btn-sm px-0 mb-2" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "Masquer" : "Afficher"} l&apos;option avancée
        </button>
        {showAdvanced && (
          <div className="form-group full-width">
            <label htmlFor="srcSelector">Sélecteur CSS des liens vers les offres (si la détection automatique ne trouve rien)</label>
            <input id="srcSelector" type="text" placeholder="Ex : .job-listing h2" value={form.selector} onChange={(e) => set("selector", e.target.value)} maxLength={200} />
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <button type="button" className="btn-sala-outline" onClick={handleTest} disabled={testing || !form.url.trim()}>
            {testing ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Test en cours (jusqu&apos;à 1 min)...</>
            ) : (
              <><i className="fas fa-vial me-1"></i> Tester</>
            )}
          </button>
          <button type="submit" className="btn-sala-primary" disabled={saving || !test || test.jobs.length === 0 || !form.name.trim()}>
            <i className="fas fa-plus me-1"></i> Ajouter la source
          </button>
          {!test && !testError && <span className="small text-muted">Testez d&apos;abord l&apos;adresse pour vérifier ce qui sera récupéré.</span>}
        </div>

        {testError && <div className="alert alert-warning mt-3 mb-0 small">Test impossible : {testError}</div>}
        {test && (
          <div className={`alert ${test.jobs.length ? "alert-success" : "alert-warning"} mt-3 mb-0 small`}>
            {test.jobs.length ? (
              <>
                <strong>{test.jobs.length} offre(s) trouvée(s)</strong> via {METHOD_LABELS[test.method]}. Aperçu :
                <ul className="mb-1 mt-2">
                  {test.jobs.slice(0, 6).map((j) => (
                    <li key={j.sourceId}>
                      {j.title}
                      {!j.description && <span className="text-muted"> (sans description)</span>}
                    </li>
                  ))}
                </ul>
                Si ce ne sont pas des offres d&apos;emploi, essayez une autre page du site ou l&apos;option avancée.
              </>
            ) : (
              <>
                Aucune offre détectée sur cette page. Essayez l&apos;adresse exacte de la liste des offres (ou du flux RSS,
                souvent <code>/feed</code>), ou l&apos;option avancée.
              </>
            )}
          </div>
        )}
      </form>
    </details>
  );
}
