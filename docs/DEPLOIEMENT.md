# 🚀 Déploiement — SistersMade (mobile)

> Comment l'application passe du code à l'iPhone.
> Distribution : **EAS** (Expo Application Services), en **distribution interne** (iPhones enregistrés, sans App Store) — validé par l'enseignant pour le critère « déploiement ».

---

## 1. Vue d'ensemble : deux chemins

| Ce qui change | Chemin | Durée | Commande |
|---|---|---|---|
| Code **natif** (nouveau module, permission iOS, plugin, icône…) | **Build** : nouvelle appli à installer | ~6 min + installation | `eas build` |
| Code **JavaScript / TypeScript** seulement (écrans, logique, styles, polices, images) | **Mise à jour OTA** (*over the air*) : l'appli installée télécharge le nouveau code | ~1 min | `eas update` |

**Règle de compatibilité** : une mise à jour OTA ne s'applique qu'aux builds de **même `runtimeVersion`** (ici `1.0.0`). Tant qu'on n'ajoute aucun module natif, le build existant reçoit toutes les mises à jour.

**Stratégie du projet (« gel natif », SM-44)** : tous les modules natifs nécessaires (caméra, localisation, NetInfo, tâche de fond, gestes…) ont été installés **avant** le premier build, le mardi 17/11. Depuis, tout le reste est livré par OTA — **sans aucun nouveau build**.

---

## 2. Prérequis (une seule fois)

1. Un compte Expo membre de l'organisation `ynov-webmobile`, et EAS CLI (`npm install -g eas-cli`, version ≥ 24.10.0, cf. `eas.json`).
2. `eas login`.
3. Le projet est déjà relié à EAS (`eas init`, `eas build:configure`, `eas update:configure` faits le 16-17/11).
4. **Variables d'environnement Firebase** : le fichier `.env` local n'est **pas envoyé** à EAS (et n'est pas versionné, voir `.env.example`). Elles sont déposées dans l'environnement EAS `preview` :
   ```bash
   eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value "…" --visibility plaintext
   # … une commande par variable EXPO_PUBLIC_FIREBASE_*
   eas env:list --environment preview   # vérification
   ```
   > Visibilité `plaintext` assumée : les variables `EXPO_PUBLIC_*` finissent de toute façon dans l'appli. La sécurité de Firebase repose sur les **règles Firestore**, pas sur la clé.
5. Pour la distribution interne iOS : l'iPhone de test doit être enregistré dans le profil de provisioning. Ici, c'était déjà le cas depuis le TP, dont l'identité est reprise (ADR-007). Pour un nouvel appareil : `eas device:create`, puis un nouveau build.

---

## 3. Profils (`eas.json`) et variantes (`app.config.js`)

| Profil | Distribution | Canal OTA | `APP_VARIANT` | Nom affiché | Bundle id |
|---|---|---|---|---|---|
| `development` | interne | `development` | `development` | « … (dev) » | identique à `app.json` |
| `preview` ✅ utilisé | interne | `preview` | `preview` | « … (preview) » | `fr.cours.tpexpo.muriel.preview` |
| `production` | store | `production` | — | — | — |

`app.config.js` lit `APP_VARIANT` et **ajoute** les suffixes (nom, scheme, bundle id) à la configuration de base d'`app.json`. Conséquence : `app.json` doit toujours contenir l'identifiant **de base** (`fr.cours.tpexpo.muriel`), jamais la version suffixée (voir § 7).

Identité reprise du TP (ADR-007) : owner `ynov-webmobile`, slug `tp-expo-muriel` — **ne pas les changer** (EAS refuserait le projet).

---

## 4. Faire un build (seulement si le natif change)

```bash
eas build --profile preview --platform ios
```

- Le profil `preview` fixe lui-même `APP_VARIANT=preview` et l'environnement EAS `preview`.
- En fin de build, EAS fournit un **lien / QR code** : l'ouvrir sur l'iPhone pour installer l'appli.
- ⚠️ Crédits de build limités : **un build = une décision explicite**. Si EAS demande un identifiant Apple personnel : répondre non (Ctrl+C) et prévenir l'enseignant.

---

## 5. Publier une mise à jour OTA (le cas courant)

Toujours depuis **`develop` à jour et propre** (ce qui est publié = ce qui est fusionné) :

```bash
git switch develop && git pull
git status --short          # doit être vide
npx tsc --noEmit            # aucune erreur (hors app-tabs.web.tsx, dette connue)
APP_VARIANT=preview eas update --channel preview --environment preview --message "Description de la version"
```

- `--channel preview` : seuls les builds du profil `preview` reçoivent cette mise à jour.
- `--environment preview` : les variables Firebase de l'environnement EAS sont injectées dans le bundle.
- `APP_VARIANT=preview` : la configuration (nom, bundle id) calculée par `app.config.js` est la même que celle du build.

**Réception sur l'iPhone** : l'appli télécharge la mise à jour au lancement et l'applique au lancement **suivant** → **fermer complètement l'appli et la rouvrir deux fois**.

---

## 6. Règles de sécurité Firestore

Les règles sont versionnées dans `firestore.rules`, mais **ne sont pas déployées automatiquement** :
1. Console Firebase → projet `sistersmade-91aa4` → Firestore → **Règles**.
2. Coller le contenu de `firestore.rules` → **Publier**.

⚠️ À faire **à chaque modification** du fichier, dans le même ticket que la fonctionnalité. Symptôme d'un oubli : « Le serveur a refusé l'opération » (`permission-denied`). Amélioration prévue : déploiement par la CI (`firebase deploy --only firestore:rules`).

---

## 7. Pièges rencontrés (et comment les éviter)

| Symptôme | Cause | Solution |
|---|---|---|
| Build iOS en échec : profil de provisioning `….preview` ≠ bundle `….preview.preview` | En répondant à une question pendant `eas build`, EAS a écrit l'identifiant **déjà suffixé** dans `app.json`, puis `app.config.js` a ajouté `.preview` une 2e fois | Remettre l'identifiant de base dans `app.json` (correctif `fix/SM-44-bundle-id`) |
| Firebase non configuré dans l'appli buildée | Le `.env` local n'est pas envoyé à EAS | `eas env:create` + `"environment"` dans chaque profil d'`eas.json` |
| La mise à jour n'apparaît pas | Elle est téléchargée au 1er lancement, appliquée au suivant | Fermer et rouvrir l'appli deux fois |
| « Le serveur a refusé l'opération » | Règles Firestore modifiées mais pas publiées | Publier dans la console (§ 6) |
| Une fonctionnalité marche dans Expo Go mais pas dans l'appli preview (ou l'inverse) | Expo Go lit le code local ; l'appli preview n'a que la **dernière OTA publiée**. Et certains modules (tâche de fond) n'existent pas dans Expo Go | Tester le natif dans le build ; publier une OTA pour tester le reste |

---

## 8. Recette après déploiement (checklist)

- [ ] L'appli s'ouvre sur la dernière version (après 2 relances).
- [ ] Session persistée : on arrive directement sur l'accueil.
- [ ] Publier une demande ; la voir apparaître en temps réel.
- [ ] Glisser une demande d'une autre → « Je peux aider ».
- [ ] Commune par position et par saisie.
- [ ] Mode avion : bandeau hors connexion, dernière liste affichée ; fermer / rouvrir hors ligne → la liste est toujours là (cache).
- [ ] Réglages iOS → Général → Actualisation en arrière-plan : SistersMade présente (tâche de fond).
- [ ] Déconnexion → retour à l'écran de connexion.

---

## 9. Versions stables

`develop` = intégration ; **`main` = versions stables taguées**. Après la recette :

```bash
git switch main && git pull
git merge --no-ff develop -m "chore(release): v0.1.0"
git tag -a v0.1.0 -m "Version présentée à la soutenance mobile (20/11/2026)"
git push && git push --tags
```