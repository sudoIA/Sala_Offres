# Application mobile : droit du travail et quiz

Ce document s'adresse au développeur de l'application Android (Java/XML).
Le site et l'app lisent désormais **les mêmes collections Firestore**. L'équipe
Sala gère leur contenu depuis le back-office du site : **Admin → Droit du
Travail** et **Admin → Quiz**.

Les deux collections sont lisibles **sans connexion**. L'app ne peut **rien y
écrire** : seuls les administrateurs du site le peuvent.

---

## 1. Droit du travail : collection `legislation`

Elle remplace `droit_du_travail`, qui n'est pas modifiée et peut rester en
place le temps de la migration.

**Changement minimal pour l'app :** les trois champs que l'app lit déjà
existent aussi dans `legislation`, avec le même format. Il suffit de remplacer
le nom de la collection.

| Champ | Type | Contenu |
|---|---|---|
| `title` | string | Titre de la fiche |
| `description` | string | **HTML complet** de la fiche : introduction, contenu, question fréquente, lien vers la source. Recalculé à chaque modification dans l'admin. |
| `readingTime` | string | Minutes de lecture, en texte (`"3"`), comme avant |

**Champs supplémentaires, facultatifs pour l'app :**

| Champ | Type | Contenu |
|---|---|---|
| `order` | number | Ordre d'affichage (1, 2, 3…). Trier dessus. |
| `topic` | string | Thème : `contrat`, `salaire`, `horaires`, `conges`, `rupture`, `hygiene`, `representation`, `conflits` |
| `topicLabel` | string | Nom du thème à afficher (« Contrat de Travail »…) |
| `articleRef` | string | Articles de loi concernés (« Art. 10 à 35 ») |
| `intro`, `bodyHtml`, `faqQuestion`, `faqAnswer` | string | Les morceaux qui composent `description` (utilisés par le site) |
| `sourceUrl`, `sourceLabel` | string | Lien et nom du texte de loi source |

```java
FirebaseFirestore.getInstance()
    .collection("legislation")          // avant : "droit_du_travail"
    .orderBy("order")
    .get()
    .addOnSuccessListener(snap -> {
        for (DocumentSnapshot d : snap.getDocuments()) {
            String title = d.getString("title");
            String html = d.getString("description");
            String minutes = d.getString("readingTime");
            // Affichage : HtmlCompat.fromHtml(html, HtmlCompat.FROM_HTML_MODE_COMPACT)
        }
    });
```

Le HTML peut contenir des balises `<i class="fas …">` (icônes du site).
`HtmlCompat.fromHtml` les ignore sans erreur.

---

## 2. Quiz : collection `quiz`

**Un document = une question.** Deux quiz sont distingués par le champ `theme` :
- `entretiens` : préparation aux entretiens d'embauche (10 questions au départ) ;
- `droit_du_travail` : quiz sur le droit du travail. Il est vide au départ et
  l'équipe le remplit depuis l'admin.

| Champ | Type | Contenu |
|---|---|---|
| `theme` | string | `entretiens` ou `droit_du_travail` |
| `question` | string | Texte de la question |
| `options` | array de maps | 2 à 4 réponses, dans l'ordre d'affichage (A, B, C…) |
| `options[].text` | string | Texte de la réponse |
| `options[].correct` | boolean | `true` pour la bonne réponse, une seule par question |
| `options[].explanation` | string | Explication à afficher après le choix de cette réponse |
| `order` | number | Ordre de la question dans le quiz |

Filtrez sur `theme` et **triez dans l'app** sur `order`. Un `where` combiné à un
`orderBy` sur un autre champ exigerait un index composite dans Firestore.

```java
FirebaseFirestore.getInstance()
    .collection("quiz")
    .whereEqualTo("theme", "entretiens")
    .get()
    .addOnSuccessListener(snap -> {
        List<DocumentSnapshot> docs = new ArrayList<>(snap.getDocuments());
        Collections.sort(docs, (a, b) -> Long.compare(
            a.getLong("order") != null ? a.getLong("order") : 0,
            b.getLong("order") != null ? b.getLong("order") : 0));

        for (DocumentSnapshot d : docs) {
            String question = d.getString("question");
            List<Map<String, Object>> options = (List<Map<String, Object>>) d.get("options");
            for (Map<String, Object> opt : options) {
                String text = (String) opt.get("text");
                boolean correct = Boolean.TRUE.equals(opt.get("correct"));
                String explanation = (String) opt.get("explanation");
            }
        }
    });
```

**Les scores des joueurs ne sont pas enregistrés** par le site. Si l'app
continue de les sauvegarder dans `Reponse/{uid}`, rien ne change de ce côté.

---

## 3. Anciennes collections

Le site ne touche **ni à `droit_du_travail` ni à `Questions`**. Elles restent
lisibles comme avant tant que l'app les utilise. Une fois l'app passée sur
`legislation` et `quiz`, l'équipe Sala pourra les archiver.
