# API Sala v1 (lecture seule)

Ce document s'adresse au développeur de l'application Android (Java/XML).
Pour les comptes candidats (connexion, profil, favoris, alertes, CV, badges)
et la sécurité, voir le guide complémentaire [app-mobile-guide.md](app-mobile-guide.md).

**Dernière mise à jour : 24 octobre 2026.** Nouveautés : `companyId` sur les
offres, paramètre `ids` (favoris), filtre `contrat` plus tolérant, `aliases`
sur les entreprises, `badges` dans le quiz.

L'API donne accès en **lecture seule** aux contenus publics du site
ongsala.com : offres d'emploi, événements, annuaires, droit du travail, quiz,
News Sala et paramètres. Elle applique **les mêmes règles que le site** :
- les offres expirées ou masquées sont exclues ;
- les événements restent visibles jusqu'à leur date de fin ;
- les descriptions sont mises en forme et nettoyées (HTML sûr) ;
- les logos et affiches sont déjà résolus en URL.

**Adresse de base :** `https://www.ongsala.com/api/v1`

Utilisez bien **www.** : l'adresse sans www redirige, et une redirection
coûte un aller-retour réseau de plus.

| Point important | Détail |
|---|---|
| Authentification | **Aucune**. Ce sont des données déjà publiques. Pas de clé API. |
| Méthodes | `GET` uniquement. Toute écriture est refusée (code 405). |
| Format | JSON en UTF-8. Les dates sont des chaînes ISO 8601 en UTC (`2026-11-22T23:24:00.000Z`). |
| Cache | Les réponses sont mises en cache 5 minutes, et 1 heure pour les annuaires, le droit du travail et le quiz. Une modification faite dans l'admin apparaît donc avec ce délai. |
| Limite | 120 requêtes par minute et par adresse IP. Au-delà, l'API répond `429` : attendez une minute avant de réessayer. |
| App Check | L'API ne dépend pas d'App Check ni des règles Firestore. Elle continuera de fonctionner quand la protection sera activée. |

## Format des réponses

**Succès (200)**

```json
{ "data": [ ... ] }
```

`data` est une liste pour les listes et un objet pour un détail. La liste des
offres ajoute un bloc de pagination :

```json
{
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

**Erreur (400, 404, 429, 500)**

```json
{ "error": { "status": 404, "message": "Offre introuvable ou expirée." } }
```

Le message est en français et peut être affiché tel quel à l'utilisateur.

---

## Points d'accès

### `GET /offres`
Offres actives, de la plus récente à la plus ancienne.

| Paramètre | Exemple | Effet |
|---|---|---|
| `page` | `2` | Page demandée (1 par défaut) |
| `limit` | `20` | Offres par page (20 par défaut, 50 au maximum) |
| `q` | `comptable` | Recherche dans le titre, l'entreprise, la ville et la description. Tous les mots doivent être présents. La casse et les accents sont ignorés. |
| `ville` | `pointe-noire` | La ville contient ce texte |
| `contrat` | `CDI` | Type de contrat. `CDI`, `CDD`, `Stage` et `Consultant` retrouvent aussi les formulations longues (« Contrat à durée indéterminée », « stagiaire », « freelance »…). Toute autre valeur doit correspondre exactement. |
| `ids` | `abc123,def456` | Ne renvoie que ces offres (50 au maximum, séparées par des virgules). Sert à afficher les **favoris** d'un candidat (`savedJobs`, voir le guide). Une offre expirée ou masquée n'est pas renvoyée : comparez avec votre liste pour afficher « offre expirée ». |

Champs d'une offre :

| Champ | Type | Contenu |
|---|---|---|
| `id` | string | Identifiant, à utiliser pour `/offres/{id}` |
| `title`, `company`, `city`, `contract` | string | Champs vides possibles (`""`) |
| `description` | string | **HTML nettoyé** et mis en forme, comme sur le site |
| `descriptionText` | string | La même chose en texte brut (pour un aperçu) |
| `email`, `tel`, `site` | string ou null | Contacts pour postuler. `site` est toujours un lien http(s) valide. |
| `languages` | string ou null | Langues demandées |
| `competences` | liste de string | Compétences |
| `companyId` | string ou null | Identifiant de la fiche de l'entreprise dans l'annuaire, pour ouvrir `GET /entreprises/{id}`. `null` si l'entreprise n'a pas de fiche. |
| `logo` | string ou null | URL du logo de l'entreprise : celui de sa fiche d'annuaire, sinon une image trouvée d'après son nom. `null` si aucun : affichez alors les initiales. |
| `publishedAt`, `deadline` | string ISO ou null | Date de publication, date limite |
| `url` | string | Lien vers l'offre sur le site, utile pour le bouton « Partager » |

### `GET /offres/{id}`
Détail d'une offre, mêmes champs que dans la liste. Renvoie `404` si l'offre
n'existe pas, est masquée ou a expiré.

### `GET /evenements`
Événements visibles, à venir ou en cours, du plus proche au plus lointain.
Paramètre facultatif : `ville`.

| Champ | Type | Contenu |
|---|---|---|
| `id`, `title`, `host`, `city` | string | `host` = organisateur |
| `summary` | string | Résumé court en texte brut |
| `description` | string | HTML nettoyé |
| `place`, `tel`, `email`, `site` | string ou null | Lieu précis et contacts de l'organisateur |
| `contactLinks` | liste | Boutons « Comment participer », prêts à afficher (voir ci-dessous) |
| `image` | string ou null | URL de l'affiche |
| `start`, `end` | string ISO ou null | Début et fin |
| `url` | string | Page Événements du site |

Chaque élément de `contactLinks` a la forme `{ "kind", "href", "label" }`.
`kind` vaut `site`, `whatsapp-group`, `tel`, `whatsapp` ou `email`.
`href` est directement utilisable dans un Intent :
- `tel:+242068477993` pour appeler ;
- `https://wa.me/242068477993` pour WhatsApp ;
- `mailto:…` pour un e-mail.

Les numéros sont déjà mis au format international.

**Sala n'enregistre pas d'inscriptions.** Le participant s'inscrit chez
l'organisateur, par ces liens.

### `GET /evenements/{id}`
Détail d'un événement. `404` s'il est masqué ou terminé.

### `GET /annuaires?categorie=…`
`categorie` est **obligatoire** : `universites`, `entreprises` ou `clubs`.
Paramètre facultatif : `ville`. Les fiches sont triées par nom.

| Champ | Type | Contenu |
|---|---|---|
| `id`, `category`, `name`, `fullName`, `type`, `city` | string | `type` : statut ou secteur (« Privé », « Banque »…) |
| `district`, `address`, `hours` | string ou null | Quartier, adresse, horaires |
| `summary`, `description` | string | Texte brut |
| `phones`, `emails` | liste de string | Sans doublons |
| `website` | string ou null | Lien http(s) valide |
| `aliases` | liste de string | Entreprises : autres noms sous lesquels elle publie ses offres (ex. « Congolaise de Microfinance » pour COMIFI). Vide pour les autres catégories. |
| `tags` | objet | `{ "label": "Filières & Départements", "items": [...] }`. Le libellé dépend de la catégorie. |
| `directionsUrl` | string ou null | Itinéraire Google Maps, à ouvrir avec un Intent |
| `logo`, `photo` | string ou null | URL des images |
| `verified` | boolean | Fiche vérifiée par l'équipe |

### `GET /entreprises/{id}`
Page d'une entreprise de l'annuaire : mêmes champs qu'une fiche de
`/annuaires?categorie=entreprises`, plus :

| Champ | Type | Contenu |
|---|---|---|
| `url` | string | Page de l'entreprise sur le site (`/entreprises/{id}`) |
| `offres` | liste | Ses offres actives, au même format que `GET /offres`, de la plus récente à la plus ancienne |

Les offres sont reliées à l'entreprise par leur nom (accents, majuscules,
ponctuation et forme juridique ignorés : « MTN CONGO S.A. » correspond à la
fiche « MTN Congo »), ou par l'un de ses `aliases`. 404 si la fiche n'existe
pas. C'est la même règle que `companyId` sur les offres : une offre avec un
`companyId` apparaît toujours dans la page de cette entreprise.

### `GET /droit-du-travail`
Fiches du droit du travail (collection `legislation`), dans l'ordre
d'affichage. Paramètre facultatif : `theme`, qui vaut `contrat`, `salaire`,
`horaires`, `conges`, `rupture`, `hygiene`, `representation` ou `conflits`.

| Champ | Type | Contenu |
|---|---|---|
| `id`, `order`, `title` | | |
| `topic`, `topicLabel`, `articleRef` | string | Thème, son libellé, articles de loi |
| `description` | string | **HTML complet de la fiche**, à afficher tel quel (même contenu que dans l'app aujourd'hui) |
| `readingTime` | string | Minutes de lecture (`"3"`) |
| `intro`, `bodyHtml`, `faqQuestion`, `faqAnswer`, `sourceUrl`, `sourceLabel` | | Les morceaux qui composent `description`, si vous voulez une mise en page plus riche |

### `GET /quiz?theme=…`
`theme` est **obligatoire** : `entretiens` ou `droit_du_travail`. Les
questions sont triées dans l'ordre du quiz.

```json
{
  "id": "entretiens-01",
  "theme": "entretiens",
  "order": 1,
  "question": "Quand le recruteur vous demande...",
  "options": [
    { "text": "...", "correct": false, "explanation": "..." },
    { "text": "...", "correct": true,  "explanation": "..." }
  ]
}
```

Chaque question a 2 à 4 options, dont **une seule** est juste.
Le quiz `droit_du_travail` compte 10 questions tirées des fiches du guide.
`explanation` est à afficher après le choix de l'utilisateur.

La réponse contient aussi, à côté de `data`, les **badges** que débloque le
meilleur score (mêmes niveaux que sur le site) :

```json
"badges": [
  { "key": "premier-pas", "label": "Premier pas", "minRatio": 0,   "hint": "Terminer le quiz" },
  { "key": "bon-niveau",  "label": "Bon niveau",  "minRatio": 0.6, "hint": "60 % de bonnes réponses" },
  { "key": "expert",      "label": "Expert",      "minRatio": 0.8, "hint": "80 % de bonnes réponses" },
  { "key": "sans-faute",  "label": "Sans faute",  "minRatio": 1,   "hint": "Toutes les réponses justes" }
]
```

Un badge est obtenu quand `best / total >= minRatio`. L'enregistrement du
score dans le compte du candidat est expliqué dans le guide.

### `GET /actualites`
Articles News Sala publiés, du plus récent au plus ancien. Champs : `id`,
`title`, `summary`, `body` (HTML nettoyé), `image`, `publishedAt`, `url`.

### `GET /parametres`
Coordonnées et réglages du site : `contactEmail`, `contactCities`,
`socialFacebook`, `socialWhatsapp`, `socialInstagram`, `socialLinkedin`.

On y trouve aussi `sectionsVisible`, avec un booléen par rubrique :
`evenements`, `annuaires`, `entretiens`, `legislation`, `actualites`. Masquez
dans l'app une rubrique que l'équipe a désactivée sur le site.

### `GET /`
Sommaire de l'API : liste des adresses disponibles.

---

## Exemple Android (Java, Retrofit)

**Dépendances (`app/build.gradle`)**

```gradle
implementation "com.squareup.retrofit2:retrofit:2.11.0"
implementation "com.squareup.retrofit2:converter-gson:2.11.0"
```

**Modèles** (un extrait : déclarez seulement les champs utilisés, Gson ignore les autres)

```java
public class ApiList<T> {
    public List<T> data;
    public Pagination pagination; // null sauf pour /offres
}

public class ApiItem<T> {
    public T data;
}

public class Pagination {
    public int page, limit, total, totalPages;
}

public class Offre {
    public String id, title, company, city, contract;
    public String description, descriptionText;
    public String email, tel, site, logo, deadline, url;
    public String companyId; // null si l'entreprise n'a pas de fiche
}

public class QuizQuestion {
    public String id, theme, question;
    public int order;
    public List<QuizOption> options;
}

public class QuizOption {
    public String text, explanation;
    public boolean correct;
}
```

**Interface**

```java
public interface SalaApi {
    @GET("offres")
    Call<ApiList<Offre>> offres(@Query("page") int page, @Query("q") String q,
                                @Query("ville") String ville, @Query("contrat") String contrat);

    @GET("offres/{id}")
    Call<ApiItem<Offre>> offre(@Path("id") String id);

    // Favoris : ids = TextUtils.join(",", savedJobs) (50 au maximum par appel)
    @GET("offres")
    Call<ApiList<Offre>> favoris(@Query("ids") String ids, @Query("limit") int limit);

    @GET("quiz")
    Call<ApiList<QuizQuestion>> quiz(@Query("theme") String theme);
}
```

Un paramètre `null` est simplement omis par Retrofit.

**Appel**

```java
SalaApi api = new Retrofit.Builder()
    .baseUrl("https://www.ongsala.com/api/v1/")   // le "/" final est obligatoire
    .addConverterFactory(GsonConverterFactory.create())
    .build()
    .create(SalaApi.class);

api.offres(1, null, "Brazzaville", null).enqueue(new Callback<ApiList<Offre>>() {
    @Override public void onResponse(Call<ApiList<Offre>> call, Response<ApiList<Offre>> res) {
        if (res.isSuccessful() && res.body() != null) {
            List<Offre> offres = res.body().data;
            // Afficher une description :
            // HtmlCompat.fromHtml(offre.description, HtmlCompat.FROM_HTML_MODE_COMPACT)
        } else if (res.code() == 429) {
            // Trop de requêtes : réessayer dans une minute.
        }
    }
    @Override public void onFailure(Call<ApiList<Offre>> call, Throwable t) {
        // Pas de réseau : afficher la dernière liste mise en cache dans l'app.
    }
});
```

## Migration depuis Firestore

L'app peut migrer **écran par écran**. L'accès direct à Firestore continue
de fonctionner en parallèle. Pour les écrans en lecture seule (offres,
événements, annuaires, droit du travail, quiz), l'API a trois avantages :
- l'app reçoit des données déjà filtrées et mises en forme ;
- elle ne dépend plus d'App Check ;
- les écrans se chargent plus vite sur une connexion lente, grâce au cache.

Le compte utilisateur, le profil, les favoris, les alertes, les CV et les
scores de quiz restent sur Firebase (Authentication et Firestore) : l'API ne
les couvre pas. Tout est expliqué dans [app-mobile-guide.md](app-mobile-guide.md).
