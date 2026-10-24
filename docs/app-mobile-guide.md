# Application mobile Sala : comptes candidats, favoris et sécurité

Ce guide s'adresse au développeur de l'application Android (Java/XML). Il
explique comment l'app peut reproduire les fonctions du site ongsala.com pour
les **candidats connectés** et quelles règles de sécurité s'appliquent :
- la connexion ;
- le profil ;
- les favoris ;
- les alertes e-mail ;
- les CV ;
- les badges de quiz ;
- la suppression du compte.

**Dernière mise à jour : 24 octobre 2026.**

Documents liés :
- [api-v1.md](api-v1.md) : l'API publique en lecture seule (offres,
  événements, annuaires, droit du travail, quiz, News) ;
- [app-mobile-contenus.md](app-mobile-contenus.md) : les collections
  `legislation` et `quiz` ;
- [app-mobile-app-check.md](app-mobile-app-check.md) : l'activation d'App Check
  et la restriction des clés API.

---

## 1. Vue d'ensemble : qui fait quoi

Le site et l'app partagent **le même projet Firebase** (`sala-a6c15`). Un
candidat a donc **un seul compte** pour les deux : il s'inscrit sur le site et
se connecte dans l'app avec les mêmes identifiants, et inversement.

| Besoin | Où le trouver | Pourquoi |
|---|---|---|
| Contenus publics : offres, événements, annuaires, droit du travail, quiz, News, réglages | **API** `https://www.ongsala.com/api/v1` | Données déjà filtrées et mises en forme, rapides, et indépendantes d'App Check |
| Connexion, inscription, mot de passe | **Firebase Authentication** | Même compte sur le site et dans l'app |
| Profil, favoris, alertes, scores de quiz | **Firestore**, document `users/{uid}` | Un document par candidat, que lui seul peut lire et modifier |
| CV enregistrés | **Firestore**, sous-collection `users/{uid}/cvs` | Réservés au candidat, e-mail vérifié obligatoire |
| Envoi des alertes e-mail | **Le serveur du site**, chaque matin | L'app n'a rien à envoyer : elle enregistre seulement les préférences |

Tout ce qui est écrit dans Firestore par l'app est **immédiatement visible
sur le site**, et inversement. Par exemple, un favori ajouté dans l'app
apparaît dans Profil → Favoris sur ongsala.com.

---

## 2. Connexion des candidats (Firebase Authentication)

Deux méthodes sont activées sur le projet : **e-mail et mot de passe**, et
**Google**.

```gradle
implementation platform("com.google.firebase:firebase-bom:33.5.1")
implementation "com.google.firebase:firebase-auth"
implementation "com.google.firebase:firebase-firestore"
```

### 2.1 Inscription par e-mail

Elle se fait en trois temps, **dans cet ordre** :
1. Créer le compte.
2. Créer le profil `users/{uid}` (section 3).
3. Envoyer l'e-mail de vérification.

```java
FirebaseAuth auth = FirebaseAuth.getInstance();
auth.createUserWithEmailAndPassword(email, password)
    .addOnSuccessListener(result -> {
        FirebaseUser user = result.getUser();
        createProfile(user, fullName, city, phone)            // section 3.2
            .addOnSuccessListener(v -> user.sendEmailVerification());
    })
    .addOnFailureListener(e -> showError(e));
```

Erreurs à traiter :
- `FirebaseAuthUserCollisionException` : l'adresse est déjà utilisée, par
  exemple par un compte créé sur le site. Proposez la connexion ou
  « mot de passe oublié ».
- `FirebaseAuthWeakPasswordException` : 6 caractères au minimum.

### 2.2 Connexion et mot de passe oublié

```java
auth.signInWithEmailAndPassword(email, password);
auth.sendPasswordResetEmail(email);   // e-mail de réinitialisation envoyé par Firebase
```

Après la connexion, appelez `ensureProfile(user)` (section 3.2). Un compte
créé ailleurs peut ne pas encore avoir de profil.

### 2.3 Connexion avec Google

Utilisez Credential Manager (ou Google Sign-In) pour obtenir un **ID token
Google**, puis :

```java
AuthCredential credential = GoogleAuthProvider.getCredential(googleIdToken, null);
auth.signInWithCredential(credential)
    .addOnSuccessListener(result -> ensureProfile(result.getUser()));
```

Le **Web client ID** à passer à Credential Manager se trouve dans
`google-services.json` : c'est l'entrée `oauth_client` de type 3. Les
empreintes **SHA-1 et SHA-256** de l'app (debug, upload et Play) doivent être
déclarées dans la console Firebase, sinon Google refuse la connexion (voir
app-mobile-app-check.md, § 1.1).

Si un candidat a d'abord créé un compte par e-mail puis se connecte avec
Google sur la même adresse, Firebase le rattache au **même compte** (même
`uid`, donc même profil). Le réglage « Link accounts that use the same email »
est activé.

### 2.4 Vérification de l'adresse e-mail

- `user.isEmailVerified()` indique si le lien reçu a été ouvert. Rafraîchissez
  avec `user.reload()` quand l'utilisateur revient dans l'app.
- Un compte **non vérifié** peut se connecter, consulter les offres, gérer ses
  favoris, ses alertes et ses quiz.
- Il ne peut pas **enregistrer de CV** : les règles Firestore le refusent
  (section 7). Affichez un bandeau « Vérifiez votre adresse » avec un bouton
  qui appelle `user.sendEmailVerification()`.
- Les comptes Google sont vérifiés d'office.

### 2.5 Équipe Sala (administrateurs et modérateurs)

Les comptes de l'équipe ont un rôle dans la collection `roles` et la double
authentification sur le site. Ils gèrent les contenus **uniquement depuis le
back-office du site**.
- L'app n'a **pas** à lire `roles` ni à proposer de fonctions d'administration.
- Un membre de l'équipe qui se connecte dans l'app est traité comme un
  candidat. Il peut ne pas avoir de profil `users/{uid}` : l'app doit le
  supporter.
- La double authentification ne concerne que l'équipe. Les candidats ne sont
  jamais concernés.

---

## 3. Profil du candidat : `users/{uid}`

### 3.1 Champs

`uid` est l'identifiant Firebase Authentication. **Seuls les champs ci-dessous
sont acceptés** par les règles de sécurité : tout autre champ fait échouer
l'écriture (`PERMISSION_DENIED`).

| Champ | Type | Règle | Utilisé pour |
|---|---|---|---|
| `uid` | string | = identifiant du compte | |
| `fullName` | string | 120 caractères max. | Nom affiché |
| `email` | string | 254 max., en minuscules | Envoi des alertes |
| `city` | string | 80 max. | « Brazzaville » par défaut |
| `phone` | string | 30 max. | |
| `role` | string | **toujours `"candidat"`** | Une autre valeur est refusée |
| `photoURL` | string ou null | 1000 max. | Photo du compte Google |
| `bio` | string | 2000 max. | « À propos » |
| `skills` | liste de string | 50 max. | Compétences |
| `savedJobs` | liste de string | 500 max. | **Favoris** (section 4) |
| `applications` | liste | 500 max. | Réservé au futur suivi des candidatures : ne pas utiliser pour l'instant |
| `jobAlerts` | map | voir section 5 | Alertes e-mail |
| `quizResults` | map | clés `entretiens`, `droit_du_travail` | Scores et badges (section 6) |
| `createdAt`, `updatedAt` | timestamp | `FieldValue.serverTimestamp()` | `createdAt` sert au rapport mensuel des inscriptions |

### 3.2 Créer le profil (inscription ou première connexion)

```java
FirebaseFirestore db = FirebaseFirestore.getInstance();

Task<Void> createProfile(FirebaseUser user, String fullName, String city, String phone) {
    Map<String, Object> p = new HashMap<>();
    p.put("uid", user.getUid());
    p.put("fullName", fullName.trim());
    p.put("email", user.getEmail().trim().toLowerCase());
    p.put("city", city.isEmpty() ? "Brazzaville" : city);
    p.put("phone", phone);
    p.put("role", "candidat");
    p.put("photoURL", user.getPhotoUrl() != null ? user.getPhotoUrl().toString() : null);
    p.put("bio", "");
    p.put("skills", new ArrayList<>());
    p.put("savedJobs", new ArrayList<>());
    p.put("applications", new ArrayList<>());
    p.put("createdAt", FieldValue.serverTimestamp());
    p.put("updatedAt", FieldValue.serverTimestamp());
    return db.collection("users").document(user.getUid()).set(p);
}

/** Après chaque connexion : crée le profil s'il n'existe pas encore. */
void ensureProfile(FirebaseUser user) {
    DocumentReference ref = db.collection("users").document(user.getUid());
    ref.get().addOnSuccessListener(snap -> {
        if (!snap.exists()) {
            String name = user.getDisplayName() != null ? user.getDisplayName() : "Candidat Sala";
            createProfile(user, name, "Brazzaville", "");
        }
    });
}
```

### 3.3 Modifier le profil

Utilisez `update()` et **pas** `set()` sans fusion, qui effacerait les
favoris, les alertes et les scores :

```java
Map<String, Object> changes = new HashMap<>();
changes.put("fullName", fullName);
changes.put("city", city);
changes.put("phone", phone);
changes.put("bio", bio);
changes.put("skills", skills);
changes.put("updatedAt", FieldValue.serverTimestamp());
db.collection("users").document(uid).update(changes);
```

### 3.4 Ancienne collection `utilisateurs`

L'app enregistre aujourd'hui ses profils dans `utilisateurs/{uid}`. Cette
collection reste autorisée, mais **le site ne la lit pas**.

Pour que le profil, les favoris et les alertes soient les mêmes partout,
l'app doit lire et écrire `users/{uid}`. Migration conseillée : à la
connexion, si `users/{uid}` n'existe pas mais que `utilisateurs/{uid}` existe,
créer `users/{uid}` à partir de ses données, en ne gardant que les champs du
tableau 3.1.

---

## 4. Favoris : `users/{uid}.savedJobs`

`savedJobs` est la liste des identifiants d'offres (`id` de l'API) mises en
favori. **Depuis le 24/10/2026, le site l'utilise** : un favori ajouté sur le
site ou dans l'app est retrouvé partout.

**Ajouter ou retirer un favori**

Utilisez `arrayUnion` et `arrayRemove` : ils évitent les doublons et
fonctionnent même si le site modifie la liste en même temps.

```java
DocumentReference me = db.collection("users").document(uid);
me.update("savedJobs", FieldValue.arrayUnion(jobId));   // ajouter
me.update("savedJobs", FieldValue.arrayRemove(jobId));  // retirer
```

**Afficher l'écran Favoris**

1. Lire `savedJobs` dans `users/{uid}`.
2. Demander ces offres à l'API en une seule requête, 50 identifiants au
   maximum par appel :
   `GET /api/v1/offres?ids=id1,id2,id3&limit=50`.
3. Les identifiants absents de la réponse correspondent à des offres expirées
   ou retirées. Affichez « Offre expirée », ou retirez-les avec `arrayRemove`
   comme le fait le site.

**Candidat non connecté :** gardez les favoris sur l'appareil, par exemple
dans les SharedPreferences. À la connexion, ajoutez-les au compte avec
`FieldValue.arrayUnion(ids...)`, puis faites du compte la référence. C'est le
comportement du site.

Limite : 500 favoris par compte.

---

## 5. Alertes e-mail : `users/{uid}.jobAlerts`

Le candidat choisit ses critères. **Chaque matin vers 7 h (heure de
Brazzaville)**, le serveur du site collecte les nouvelles offres et envoie à
chaque candidat un seul e-mail regroupant les offres qui correspondent. L'app
n'a qu'à enregistrer les préférences.

```json
"jobAlerts": {
  "enabled": true,
  "keywords": ["comptable", "finance"],
  "city": "Brazzaville",
  "contract": "CDI"
}
```

| Champ | Règle | Effet |
|---|---|---|
| `enabled` | booléen, **obligatoire** | Alerte active ou en pause |
| `keywords` | liste, **obligatoire** (peut être vide), 10 mots au maximum | Un seul mot présent dans le titre, l'entreprise ou la description suffit. Vide = toutes les offres. |
| `city` | texte, 80 max. | La ville de l'offre contient ce texte. Vide = toutes les villes. |
| `contract` | texte, 40 max. | `CDI`, `CDD`, `Stage`, `Consultant` (ou vide = tous). Les formulations longues sont reconnues (« Contrat à durée indéterminée »…). |

**Aucun autre champ** n'est accepté dans `jobAlerts`. Les critères sont
appliqués sans tenir compte des majuscules ni des accents.

```java
Map<String, Object> alerts = new HashMap<>();
alerts.put("enabled", true);
alerts.put("keywords", Arrays.asList("comptable", "finance"));
alerts.put("city", "Brazzaville");
alerts.put("contract", "CDI");
db.collection("users").document(uid)
  .update("jobAlerts", alerts, "updatedAt", FieldValue.serverTimestamp());
```

L'e-mail part vers le champ `email` du profil. Il doit donc être renseigné.
L'envoi dépend du service d'e-mails configuré côté serveur par l'équipe Sala :
rien à faire dans l'app.

---

## 6. Quiz : scores et badges, `users/{uid}.quizResults`

Les questions viennent de l'API : `GET /api/v1/quiz?theme=…`. La réponse donne
aussi la liste des **badges** avec leur seuil (`minRatio`).

Le profil garde **le meilleur résultat** de chaque quiz :

```json
"quizResults": {
  "droit_du_travail": { "best": 8, "total": 10, "attempts": 3, "lastAt": "2026-10-24T09:12:00.000Z" },
  "entretiens":       { "best": 5, "total": 5,  "attempts": 1, "lastAt": "2026-10-20T18:40:00.000Z" }
}
```

**À la fin d'un quiz** (`score` bonnes réponses sur `total`) :
1. Lire le résultat précédent du thème, s'il existe.
2. Garder le meilleur **en proportion** : le nombre de questions peut changer.
   - Si `score / total > best / total précédent`, alors `best = score` et
     `total = total`.
   - Sinon, garder l'ancien `best` et l'ancien `total`.
3. Faire `attempts = attempts + 1` et `lastAt` = date du jour au format ISO.
4. Enregistrer seulement ce thème :

```java
db.collection("users").document(uid)
  .update("quizResults.droit_du_travail", resultMap);
```

**Badges obtenus :** ce sont tous ceux dont `best / total >= minRatio`. Un
nouveau badge est obtenu s'il ne l'était pas avant la tentative. Les badges
gagnés dans l'app apparaissent aussi sur le site, dans Profil → À propos.

---

## 7. CV enregistrés : `users/{uid}/cvs/{cvId}`

Un document par CV créé avec le générateur du site.
- **Lecture et suppression :** le candidat, pour ses propres CV.
- **Création et modification :** le candidat, **avec une adresse e-mail
  vérifiée** (`email_verified`). Sinon les règles refusent l'écriture.

```json
{
  "template": "classic",
  "personal": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "address": "",
                "city": "Brazzaville", "country": "République du Congo",
                "birthDate": "", "photo": null, "bio": "" },
  "experiences": [ { "title": "", "company": "", "city": "", "period": "", "description": "" } ],
  "education":   [ { "degree": "", "school": "", "city": "", "year": "" } ],
  "projects":    [ { "name": "", "role": "", "description": "" } ],
  "skills": ["Excel"],
  "hobbies": ["Lecture"],
  "languages": [ { "name": "Français", "level": "Courant" } ],
  "userId": "<uid>",
  "updatedAt": "<serverTimestamp>"
}
```

- `template` vaut `classic`, `marine` ou `moderne`.
- `personal.photo` est une image en texte (data URL). Firestore limite un
  document à **1 Mo** : réduisez la photo avant de l'enregistrer, à 300 Ko
  maximum.

Le PDF est produit par le site. Dans l'app, le plus simple est de lister les
CV et d'ouvrir le générateur du site (`https://www.ongsala.com/cv-builder`).

---

## 8. Supprimer son compte (obligatoire sur Google Play)

Google Play exige que l'app permette de supprimer son compte. Il faut
procéder **dans cet ordre**, comme le site :
1. **Reconnecter** l'utilisateur, car Firebase exige une connexion récente :
   - compte e-mail : `user.reauthenticate(EmailAuthProvider.getCredential(email, password))` ;
   - compte Google : nouvelle connexion Google, puis `reauthenticate` avec ce
     credential.
2. Supprimer chaque document de `users/{uid}/cvs`.
3. Supprimer `users/{uid}`, et `utilisateurs/{uid}` et `Reponse/{uid}` s'ils
   existent.
4. `user.delete()`.

La reconnexion vient en premier pour ne jamais laisser un compte vidé de ses
données mais toujours existant.

---

## 9. Compteurs anonymes (facultatif, recommandé)

Le rapport mensuel de l'ONG (Admin → Rapport mensuel) compte les
consultations d'offres et les quiz terminés. Pour que l'usage de l'app y
figure, l'app peut ajouter **+1** aux mêmes compteurs. Ils sont anonymes et
les règles n'acceptent qu'une augmentation de 1.

```java
// À l'ouverture d'une offre (une fois par offre et par session) :
db.collection("job_views").document(jobId)
  .set(Collections.singletonMap("count", FieldValue.increment(1)), SetOptions.merge());

String month = new SimpleDateFormat("yyyy-MM", Locale.US).format(new Date()); // "2026-10"
db.collection("stats_monthly").document(month)
  .set(Collections.singletonMap("jobViews", FieldValue.increment(1)), SetOptions.merge());

// À la fin d'un quiz :
db.collection("stats_monthly").document(month)
  .set(Collections.singletonMap("quizzes", FieldValue.increment(1)), SetOptions.merge());
```

N'utilisez pas le compteur `visits` : il mesure les visites du site web.

---

## 10. Sécurité

### 10.1 Ce que les règles Firestore autorisent

Les règles sont appliquées par Firebase lui-même. Une requête interdite
échoue avec `PERMISSION_DENIED`, quel que soit le code de l'app.

| Collection | Visiteur | Candidat connecté | Remarque |
|---|---|---|---|
| `emplois`, `events`, `legislation`, `quiz`, `universites`, `entreprises`, `clubs_anglais`, `settings` | lecture | lecture | Écriture : équipe Sala uniquement. **Préférez l'API.** |
| `news` | lecture des articles publiés | idem | |
| `users/{uid}` | - | lecture et écriture **de son propre** document | Champs limités (§ 3.1). Personne ne lit le profil d'un autre. |
| `users/{uid}/cvs` | - | les siens. Écriture avec e-mail vérifié. | |
| `job_views`, `stats_monthly` | +1 seulement | +1 seulement | Lecture : équipe Sala |
| `roles`, `emplois_import`, `import_sources`, `import_runs`, `admin_logs`, `client_errors` | - | - | Back-office uniquement |
| `Questions` | - | lecture | Ancienne collection de l'app |
| `Reponse/{uid}`, `utilisateurs/{uid}` | - | les siens | Anciennes collections de l'app |
| `droit_du_travail`, `NativeAds`, `InterstialAds`, `BannerAds` | lecture | lecture | |
| Toute autre collection (ex. `teste`) | - | - | **Refusée par défaut** |

### 10.2 Règles à respecter

1. **Un seul fichier de règles.** Les règles Firestore du site et de l'app sont
   réunies dans `firestore.rules`, dans le dépôt du site. Ne publiez **jamais**
   de règles depuis le projet de l'app : cela remplacerait celles du site,
   comme le 2 octobre 2026. Pour toute nouvelle collection, demandez qu'elle
   soit ajoutée à ce fichier.
2. **Aucun secret dans l'app.** Pas de compte de service, de clé serveur ou de
   mot de passe d'administration. `google-services.json` n'est pas un secret :
   la sécurité repose sur les règles, App Check et la restriction de la clé
   Android.
3. **Ne jamais se fier à l'app pour les droits.** Un rôle, un statut ou un
   « est admin » stocké ou calculé dans l'app ne protège rien. Seules les
   règles Firestore et le serveur décident.
4. **App Check.** Intégrez le SDK App Check avec Play Integrity (voir
   app-mobile-app-check.md). Il sera rendu obligatoire sur Firestore **une
   fois** que la version de l'app qui l'intègre sera publiée et adoptée. Les
   versions sans App Check ne pourront alors plus utiliser Firestore. L'API
   `/api/v1` n'est pas concernée.
5. **Clé API Android.** Elle sera restreinte au package et à l'empreinte SHA-1
   de l'app signée. Ne l'utilisez pas en dehors de l'app.
6. **Données personnelles.** N'enregistrez pas les données d'un candidat
   ailleurs que dans son compte : pas de journalisation des e-mails, numéros
   ou CV dans des outils tiers. Déconnexion : `FirebaseAuth.getInstance().signOut()`,
   puis effacez les favoris gardés sur l'appareil.

### 10.3 Comprendre un `PERMISSION_DENIED`

| Cause probable | Correction |
|---|---|
| Champ inconnu dans `users/{uid}` (ex. `lastLogin`, `age`) | Ne garder que les champs du § 3.1 |
| `set()` complet sur un profil existant avec un champ invalide | Utiliser `update()` sur les seuls champs modifiés |
| `role` différent de `"candidat"` | Toujours `"candidat"` |
| `jobAlerts` sans `enabled` ou `keywords`, ou avec un champ en trop | § 5 |
| CV enregistré sans e-mail vérifié | `user.reload()`, puis vérifier `isEmailVerified()` |
| Document d'un autre utilisateur | Toujours utiliser `FirebaseAuth.getInstance().getUid()` |
| App Check activé et app sans App Check | Intégrer App Check (§ 10.2) |

---

## 11. Liste de contrôle

- [ ] Inscription par e-mail : compte, puis `users/{uid}`, puis e-mail de vérification
- [ ] Connexion e-mail et Google, `ensureProfile` après chaque connexion
- [ ] Mot de passe oublié
- [ ] Lecture et écriture du profil dans `users` (et plus `utilisateurs`), avec `update()`
- [ ] Favoris avec `arrayUnion`/`arrayRemove` et écran Favoris par `GET /offres?ids=`
- [ ] Préférences d'alertes (`jobAlerts`)
- [ ] Scores de quiz (`quizResults`) et badges (seuils de l'API)
- [ ] Suppression du compte dans l'ordre du § 8
- [ ] Logos et pages entreprises : `logo` et `companyId` des offres, `GET /entreprises/{id}`
- [ ] Rubriques masquées selon `GET /parametres` → `sectionsVisible`
- [ ] App Check (Play Integrity) intégré, empreintes SHA déclarées
- [ ] Aucune publication de règles depuis le projet de l'app

Pour toute question sur ce guide ou pour ajouter une collection aux règles,
contactez l'équipe Sala.
