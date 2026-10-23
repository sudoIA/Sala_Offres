# Sala — Activation d'App Check et restriction des clés API

**À l'attention du développeur de l'application mobile Sala (Android)**

Le site web et l'application mobile partagent le même projet Firebase (`sala-a6c15`). Nous allons y activer deux protections :

1. **Firebase App Check sur Cloud Firestore** : Firestore refusera toute requête qui ne vient pas d'une application authentique (le site ou l'app publiée sur le Play Store). Cela bloque les robots et les scripts qui utilisent nos identifiants Firebase en dehors de nos applications.
2. **La restriction de la clé API Android** : la clé de `google-services.json` ne sera plus utilisable que par l'application Sala signée.

> ⚠️ **Une fois App Check activé sur Firestore, toute version de l'app qui n'intègre pas App Check ne pourra plus lire ni écrire dans Firestore.** Rien ne sera activé tant que la nouvelle version de l'app (avec App Check) ne sera pas publiée et adoptée par les utilisateurs. La date d'activation sera fixée ensemble.

---

## 1. Ce qu'il faut faire dans l'application

### 1.1 Déclarer les empreintes de signature

1. **Play Console → [l'app] → Test et publication → Intégrité de l'application → Signature d'application** : relever l'empreinte **SHA-256** et l'empreinte **SHA-1** du *certificat de clé de signature d'application* (la clé de Google Play), ainsi que celles du *certificat de clé d'importation*.
2. Relever aussi l'empreinte de la clé **debug** locale :
   ```bash
   ./gradlew signingReport
   ```
3. **Console Firebase → Paramètres du projet → Vos applications → app Android** : ajouter toutes ces empreintes SHA-1 et SHA-256 (bouton « Ajouter une empreinte »).

### 1.2 Enregistrer l'app dans App Check (Play Integrity)

1. **Play Console → Intégrité de l'application → API Play Integrity** : lier l'application au projet Google Cloud `sala-a6c15`.
2. **Console Firebase → App Check → onglet Applications → app Android → Play Integrity** : valider l'enregistrement (les empreintes SHA-256 sont reprises de l'étape 1.1).

### 1.3 Intégrer le SDK App Check

App Check doit être installé **au démarrage de l'application, avant toute utilisation de Firestore**.

#### Option A — Application Android native (Kotlin)

`app/build.gradle.kts` :

```kotlin
dependencies {
    implementation(platform("com.google.firebase:firebase-bom:35.1.0")) // ou la BoM déjà utilisée par le projet
    implementation("com.google.firebase:firebase-appcheck-playintegrity")
    debugImplementation("com.google.firebase:firebase-appcheck-debug")
}
```

Dans la classe `Application` (ou au tout début de l'activité principale) :

```kotlin
import com.google.firebase.Firebase
import com.google.firebase.appcheck.appCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory
import com.google.firebase.initialize

class SalaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Firebase.initialize(this)
        Firebase.appCheck.installAppCheckProviderFactory(
            if (BuildConfig.DEBUG) DebugAppCheckProviderFactory.getInstance()
            else PlayIntegrityAppCheckProviderFactory.getInstance()
        )
    }
}
```

> Si le projet est en Java : `FirebaseAppCheck.getInstance().installAppCheckProviderFactory(PlayIntegrityAppCheckProviderFactory.getInstance());` juste après `FirebaseApp.initializeApp(this);`.
> `DebugAppCheckProviderFactory` vient de la dépendance `debugImplementation` : si la variante release ne compile pas, placer ce choix dans un fichier propre à la variante `debug`.

#### Option B — Application Flutter

```bash
flutter pub add firebase_app_check
```

```dart
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await FirebaseAppCheck.instance.activate(
    androidProvider: kReleaseMode ? AndroidProvider.playIntegrity : AndroidProvider.debug,
  );
  runApp(const SalaApp());
}
```

### 1.4 Jeton de débogage (émulateur, builds de test)

En build *debug*, le SDK écrit au démarrage dans **Logcat** une ligne du type :

```
Enter this debug secret into the allow list in the Firebase Console for your project: 1234abcd-....
```

Ajouter ce jeton dans **Console Firebase → App Check → Applications → app Android → ⋮ → Gérer les jetons de débogage**. Sans cela, les builds de développement seront bloqués après l'activation. Il faut un jeton par appareil ou émulateur, et ce jeton ne doit jamais être partagé publiquement.

### 1.5 Publier et vérifier

1. Publier la nouvelle version sur le Play Store.
2. Si l'app possède un mécanisme de mise à jour obligatoire (version minimale), le préparer pour la date d'activation : les anciennes versions installées seront bloquées.
3. Dans **Console Firebase → App Check → APIs → Cloud Firestore**, vérifier que les requêtes de l'app apparaissent comme **« Vérifiées »**. Nous suivrons ensemble ce taux avant d'activer l'application stricte.

---

## 2. Restriction de la clé API Android

Pour l'instant, rien n'est à faire dans le code : la clé reste celle du fichier `google-services.json`. Merci de nous transmettre :

- le **nom du package** de l'application (ex. `com.ongsala.app`) ;
- les **empreintes SHA-1** relevées à l'étape 1.1 (release Play, importation et debug) ;
- la valeur de `current_key` dans `google-services.json`, pour identifier la clé utilisée par l'app.

Cette clé sera ensuite limitée, dans Google Cloud Console → API et services → Identifiants, aux **applications Android** portant ce package et ces empreintes. Le site web utilisera désormais sa propre clé, distincte, restreinte aux domaines du site. Après la restriction, une version de l'app signée avec une autre clé (une nouvelle clé debug, par exemple) devra voir son empreinte ajoutée.

---

## 3. Règles de sécurité Firestore : à ne plus publier depuis l'app

Le 2 octobre 2026, une publication de règles faite depuis le projet de l'application a **remplacé** celles du site et bloqué le back-office. Les règles des deux applications sont désormais réunies dans **un seul fichier**, `firestore.rules`, à la racine du dépôt du site. Il couvre déjà les collections de l'app : `Questions`, `Reponse`, `utilisateurs`, `droit_du_travail`, `NativeAds`, `InterstialAds`, `BannerAds` et les collections publiques partagées.

Pour toute modification de règles, il faut partir de ce fichier (et non d'un fichier propre à l'app). Le plus simple est de demander la modification à l'équipe du site, qui la teste sur l'émulateur avant de la publier.

---

## 4. Calendrier proposé

| Étape | Qui | Quand |
|---|---|---|
| Intégration App Check + publication Play Store | Dev mobile | Dès que possible |
| Envoi du package, des SHA-1 et de la clé utilisée | Dev mobile | Avec la publication |
| Suivi des requêtes « vérifiées » (site + app) | Équipe Sala | 1 à 2 semaines |
| Activation stricte d'App Check sur Firestore | Équipe Sala | Date fixée ensemble, une fois la quasi-totalité des requêtes vérifiées |
| Restriction de la clé API Android | Équipe Sala | Après la publication de la nouvelle version |

Les questions sont à adresser à l'équipe Sala.
