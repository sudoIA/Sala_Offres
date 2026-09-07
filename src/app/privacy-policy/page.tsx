// src/app/privacy-policy/page.tsx
// Politique de confidentialité — contenu statique, restylé au design Sala
// (l'ancienne page utilisait une palette bleue incohérente avec le reste du site).

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de Confidentialité — Sala",
  description:
    "Politique de confidentialité de la plateforme Sala — Emploi, Stage & Formation. Comment nous collectons, utilisons et protégeons vos données personnelles.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <header className="pp-header">
        <div className="pp-badge">Application Mobile &amp; Plateforme Web</div>
        <h1>Politique de Confidentialité</h1>
        <p>Comment <strong>Sala</strong> collecte, utilise et protège vos données personnelles</p>
        <div className="pp-meta">Dernière mise à jour : <strong>13 avril 2026</strong> &nbsp;|&nbsp; Version 2.0</div>
      </header>

      <main className="pp-main">
        <div className="pp-toc">
          <h2>Sommaire</h2>
          <ol>
            <li><a href="#presentation">Présentation de l&apos;application</a></li>
            <li><a href="#donnees-collectees">Données personnelles collectées</a></li>
            <li><a href="#utilisation">Utilisation des données</a></li>
            <li><a href="#partage">Partage des données</a></li>
            <li><a href="#securite">Sécurité des données</a></li>
            <li><a href="#droits">Vos droits</a></li>
            <li><a href="#retention">Durée de conservation</a></li>
            <li><a href="#mineurs">Protection des mineurs</a></li>
            <li><a href="#modifications">Modifications de la politique</a></li>
            <li><a href="#contact">Nous contacter</a></li>
          </ol>
        </div>

        <section className="pp-section" id="presentation">
          <h2><span className="pp-icon">🏢</span> 1. Présentation de l&apos;application</h2>
          <p>
            <strong>Sala — Emploi, Stage &amp; Formation</strong> est une plateforme développée par <strong>ONG SALA</strong>,
            destinée à faciliter la mise en relation entre chercheurs d&apos;emploi, stagiaires et recruteurs en République du Congo.
          </p>
          <p>
            Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons les informations
            personnelles des utilisateurs de notre application mobile et de notre site web.
          </p>
          <div className="pp-highlight">
            <p>
              En utilisant Sala, vous acceptez les pratiques décrites dans cette politique de confidentialité. Si vous n&apos;êtes
              pas d&apos;accord, veuillez cesser d&apos;utiliser nos services.
            </p>
          </div>
        </section>

        <section className="pp-section" id="donnees-collectees">
          <h2><span className="pp-icon">📊</span> 2. Données personnelles collectées</h2>
          <p>Selon la façon dont vous utilisez la plateforme, nous pouvons collecter les catégories de données suivantes :</p>

          <table className="pp-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Données collectées</th>
                <th>Obligatoire</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Compte utilisateur</strong></td>
                <td>Adresse e-mail, mot de passe (chiffré)</td>
                <td>Oui</td>
              </tr>
              <tr>
                <td><strong>Offres d&apos;emploi</strong></td>
                <td>Ville, type de contrat, secteur d&apos;activité</td>
                <td>Non</td>
              </tr>
              <tr>
                <td><strong>Contact recruteur</strong></td>
                <td>E-mail professionnel, numéro de téléphone (optionnel)</td>
                <td>Non</td>
              </tr>
              <tr>
                <td><strong>Données techniques</strong></td>
                <td>Identifiant d&apos;appareil, version du navigateur, logs d&apos;erreur</td>
                <td>Automatique</td>
              </tr>
            </tbody>
          </table>

          <h3>Données que nous ne collectons PAS</h3>
          <ul>
            <li>Données de localisation GPS en temps réel</li>
            <li>Contacts téléphoniques</li>
            <li>Photos ou fichiers stockés sur l&apos;appareil (hors upload volontaire pour le CV)</li>
            <li>Informations bancaires ou financières</li>
            <li>Données biométriques</li>
          </ul>
        </section>

        <section className="pp-section" id="utilisation">
          <h2><span className="pp-icon">⚙️</span> 3. Utilisation des données</h2>
          <p>Nous utilisons vos données personnelles uniquement aux fins suivantes :</p>
          <ul>
            <li><strong>Authentification :</strong> Créer et gérer votre compte utilisateur via Firebase Authentication</li>
            <li><strong>Affichage des offres :</strong> Vous présenter des offres d&apos;emploi, de stage et de formation pertinentes</li>
            <li><strong>Communication :</strong> Vous envoyer des notifications liées à votre candidature ou à de nouvelles offres</li>
            <li><strong>Amélioration du service :</strong> Analyser les usages pour améliorer l&apos;expérience utilisateur</li>
            <li><strong>Sécurité :</strong> Détecter et prévenir les activités frauduleuses ou abusives</li>
          </ul>
          <p>Vos données ne sont <strong>jamais utilisées à des fins publicitaires</strong> ou revendues à des tiers.</p>
        </section>

        <section className="pp-section" id="partage">
          <h2><span className="pp-icon">🔗</span> 4. Partage des données</h2>
          <p>Nous ne vendons, n&apos;échangeons ni ne louons vos données personnelles à des tiers. Nous pouvons partager vos informations uniquement dans les cas suivants :</p>

          <h3>Prestataires de services techniques</h3>
          <ul>
            <li>
              <strong>Google Firebase</strong> (Google LLC) — Authentification, base de données Firestore, hébergement.
              Politique de Google : <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
            </li>
          </ul>

          <h3>Obligations légales</h3>
          <p>
            Nous pouvons divulguer vos informations si la loi l&apos;exige ou si nous estimons de bonne foi qu&apos;une telle
            divulgation est nécessaire pour se conformer à une procédure judiciaire ou protéger les droits, la propriété ou
            la sécurité de nos utilisateurs.
          </p>
        </section>

        <section className="pp-section" id="securite">
          <h2><span className="pp-icon">🛡️</span> 5. Sécurité des données</h2>
          <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :</p>
          <ul>
            <li><strong>Chiffrement en transit :</strong> Toutes les communications utilisent le protocole HTTPS/TLS</li>
            <li><strong>Chiffrement des mots de passe :</strong> Les mots de passe sont hashés et jamais stockés en clair (via Firebase Auth)</li>
            <li><strong>Règles de sécurité Firestore :</strong> L&apos;accès aux données est limité aux utilisateurs authentifiés et autorisés</li>
            <li><strong>Accès administrateur restreint :</strong> Seuls les administrateurs vérifiés peuvent accéder aux données sensibles</li>
          </ul>
          <p>Malgré ces mesures, aucun système n&apos;est infaillible. En cas de violation de données, nous nous engageons à vous en informer dans les meilleurs délais.</p>
        </section>

        <section className="pp-section" id="droits">
          <h2><span className="pp-icon">⚖️</span> 6. Vos droits</h2>
          <p>Conformément aux lois applicables sur la protection des données, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d&apos;accès :</strong> Obtenir une copie des données personnelles que nous détenons sur vous</li>
            <li><strong>Droit de rectification :</strong> Corriger des données inexactes ou incomplètes</li>
            <li><strong>Droit à l&apos;effacement :</strong> Demander la suppression de vos données personnelles</li>
            <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format lisible par machine</li>
            <li><strong>Droit d&apos;opposition :</strong> Vous opposer au traitement de vos données dans certains cas</li>
            <li><strong>Droit de suppression du compte :</strong> Supprimer votre compte et toutes vos données associées</li>
          </ul>
          <p>Pour exercer ces droits, contactez-nous à l&apos;adresse indiquée dans la section <a href="#contact">Nous contacter</a>.</p>
        </section>

        <section className="pp-section" id="retention">
          <h2><span className="pp-icon">🗓️</span> 7. Durée de conservation</h2>
          <p>Nous conservons vos données personnelles aussi longtemps que votre compte est actif ou que cela est nécessaire pour vous fournir nos services :</p>
          <ul>
            <li><strong>Données de compte :</strong> Conservées tant que le compte est actif</li>
            <li><strong>Données d&apos;offres :</strong> Conservées pendant la durée de publication</li>
            <li><strong>Logs techniques :</strong> Conservés maximum 90 jours</li>
            <li><strong>Après suppression du compte :</strong> Toutes les données sont supprimées sous 30 jours</li>
          </ul>
        </section>

        <section className="pp-section" id="mineurs">
          <h2><span className="pp-icon">👶</span> 8. Protection des mineurs</h2>
          <p>
            La plateforme <strong>Sala</strong> n&apos;est pas destinée aux enfants de moins de 13 ans. Nous ne collectons pas
            sciemment de données personnelles provenant d&apos;enfants de moins de 13 ans.
          </p>
          <p>
            Si vous êtes parent ou tuteur et découvrez que votre enfant nous a fourni des données personnelles, veuillez nous
            contacter immédiatement afin que nous puissions supprimer ces informations.
          </p>
        </section>

        <section className="pp-section" id="modifications">
          <h2><span className="pp-icon">🔄</span> 9. Modifications de la politique</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification
            sera publiée sur cette page avec une nouvelle date de mise à jour.
          </p>
          <p>
            Pour les modifications importantes, nous vous en informerons via une notification sur la plateforme ou par
            e-mail. Votre utilisation continue de Sala après publication des modifications constitue votre acceptation de
            la nouvelle politique.
          </p>
          <div className="pp-highlight">
            <p>Historique des versions : v1.0 — Création initiale | v2.0 — Mise à jour 13 avril 2026</p>
          </div>
        </section>

        <section className="pp-section" id="contact">
          <h2><span className="pp-icon">📬</span> 10. Nous contacter</h2>
          <p>Pour toute question relative à cette politique de confidentialité, à vos données personnelles ou pour exercer vos droits, contactez-nous :</p>
          <div className="pp-contact-card">
            <p><strong>ONG SALA</strong></p>
            <p>Plateforme : Sala — Emploi, Stage &amp; Formation</p>
            <p>E-mail : <a href="mailto:contact.ongsala@gmail.com">contact.ongsala@gmail.com</a></p>
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: "var(--sala-text-muted)" }}>
            Nous nous engageons à répondre à votre demande dans un délai de <strong>30 jours ouvrables</strong>.
          </p>
        </section>
      </main>

      <footer className="pp-footer">
        <p>&copy; 2026 <strong>ONG SALA</strong> — Tous droits réservés &nbsp;|&nbsp; <Link href="/">Retour au site</Link></p>
      </footer>
    </>
  );
}
