# Décisions d'architecture (ADR) — SistersMade mobile

> Format : Contexte / Choix / Pourquoi / Alternatives / Conséquences / À revalider si.
> Échéance : soutenance du cours Développement mobile, vendredi 20 novembre 2026.
> Horizon : projet de fin d'études RNCP 7, septembre 2027 (web + mobile + vrai lancement).

## ADR-001 — Backend : Firebase derrière une couche d'accès isolée (2026-11-16)
- **Contexte** : 4 jours de développement, en solo ; la grille demande « API REST ou Firebase », une authentification et une autorisation.
- **Choix** : Firebase Auth + Firestore + Security Rules. Tous les appels passent par `src/services/` ; les écrans n'importent jamais Firebase.
- **Pourquoi** : authentification, base de données et hébergement fournis ; l'autorisation est déclarée dans les règles Firestore ; vu en cours.
- **Alternatives** : API Spring Boot (maîtrisée au travail, mais trop longue à construire et héberger en 4 jours).
- **Conséquences** : dépendance au fournisseur, limitée par la couche `services`.
- **À revalider si** : RNCP 7 (ledger de temps transactionnel → back Spring + base relationnelle envisageables).

## ADR-002 — Fonctionnalités natives : localisation approximative + caméra QR (2026-11-16)
- **Contexte** : au moins 2 fonctionnalités natives exigées ; elles doivent servir le produit.
- **Choix** : localisation (afficher les demandes proches, distance en km, position **approximative**) et caméra (scanner un QR pour valider un échange).
- **Pourquoi** : utiles à une entraide locale ; code déjà maîtrisé (TP4 : PermissionGate, QR, localisation).
- **Alternatives** : notifications push (capacité Apple Push non activée sur le profil), calendrier, biométrie.
- **Conséquences** : demander les permissions au bon moment, avec un plan B en cas de refus.
- **À revalider si** : la capacité Push est activée → notifications « réponse à ta demande ».

## ADR-003 — Banque du temps minimale (2026-11-16)
- **Contexte** : « le temps est la monnaie » est le cœur du projet, mais un ledger complet est hors de portée cette semaine.
- **Choix** : un échange validé par QR transfère des heures ; un solde est affiché.
- **Pourquoi** : rend le concept concret et démontrable en soutenance.
- **Alternatives** : reporter entièrement (perte du cœur du produit) ; ledger complet (trop long).
- **Conséquences** : règles détaillées (qui scanne, double confirmation, litiges) à définir avant de coder le QR.
- **À revalider si** : RNCP 7 (ledger transactionnel, concurrence, audit).

## ADR-004 — Navigation : Expo Router (2026-11-16)
- **Contexte** : navigation multi-écrans exigée.
- **Choix** : Expo Router (onglets, pile, modale), fichiers dans `src/app`.
- **Pourquoi** : intégré au modèle Expo, vu au TP3 ; compatible web pour 2027.
- **Alternatives** : React Navigation configurée à la main.
- **Conséquences** : paramètres de route = chaînes à convertir et valider ; écran d'ancrage pour les liens profonds.
- **À revalider si** : —

## ADR-005 — Données serveur : TanStack Query dans des hooks personnalisés (2026-11-16)
- **Contexte** : états chargement / erreur / succès et mode hors ligne exigés.
- **Choix** : TanStack Query, encapsulé dans des hooks personnalisés (`useDemandes`, `usePublierDemande`…), avec cache persisté.
- **Pourquoi** : états, cache, déduplication et nouvelles tentatives fournis ; les écrans ignorent la source des données.
- **Alternatives** : Redux Toolkit (+ RTK Query), plus lourd ; gestion manuelle (vécue au TP2 : verbeuse, sans erreurs ni cache).
- **Conséquences** : une seule façon d'accéder aux données dans toute l'appli.
- **À revalider si** : —

## ADR-006 — Un seul dépôt : sistersmade-mobile (2026-11-16)
- **Contexte** : les TP vivent dans `tp-expo` ; le projet doit avoir un historique Git propre (critère de la grille).
- **Choix** : nouveau dépôt, créé avec `create-expo-app` (SDK 58) ; le code des TP est recopié au cas par cas.
- **Pourquoi** : historique lisible, aucun code inutile.
- **Alternatives** : cloner `tp-expo` (historique mélangé, nettoyage long).
- **Conséquences** : `app.config.js` et `eas.json` à recopier.
- **À revalider si** : —

## ADR-007 — Cible : iOS (2026-11-16)
- **Contexte** : la développeuse a un iPhone, pas de Mac ; profils de provisionnement gérés par l'enseignant.
- **Choix** : iOS via EAS (development build puis build de prod) ; code compatible Android.
- **Pourquoi** : seul appareil de test disponible.
- **Alternatives** : Android (pas d'appareil physique).
- **Conséquences** : dépendance au profil fourni par l'enseignant ; crédits de build limités → liste des modules natifs figée avant le premier build.
- **À revalider si** : un appareil Android devient disponible.

## ADR-008 — Documentation dans le dépôt (2026-11-16)
- **Contexte** : le jury pose des questions sur les choix techniques ; la grille note la documentation.
- **Choix** : `docs/` versionné avec le code (ce fichier, `SUIVI.md`, documentation de déploiement).
- **Pourquoi** : la doc évolue avec le code ; preuves réutilisables pour le RNCP 7.
- **Alternatives** : document externe (risque de décalage avec le code).
- **Conséquences** : chaque décision structurante ajoute une entrée ici.
- **À revalider si** : —

---

## ADR-007 — Amendement du 17/11/2026 : réutilisation de l'identité du TP

**Contexte.** Créer un nouvel App ID Apple et un nouveau profil de provisioning demande une intervention de l'enseignant (compte Apple de l'école) et du temps, à 4 jours de la soutenance.

**Décision.** Le projet réutilise l'identité du TP Expo :
- bundle id iOS / package Android : `fr.cours.tpexpo.muriel` (variante `.preview`) ;
- projet EAS : `ynov-webmobile/tp-expo-muriel` (`projectId` 3bffded7-…) ;
- `app.config.js` et `eas.json` repris du TP à l'identique.
Le nom affiché reste « SistersMade » (`(dev)` / `(preview)` selon la variante).

**Conséquences.**
- ✅ Le profil de provisioning existant (avec l'UDID de l'iPhone de test) reste valable.
- ⚠️ Le `slug` doit rester `tp-expo-muriel` : EAS refuse un slug différent de celui lié au `projectId`.
- ⚠️ Le profil n'inclut pas la capacité Push : pas de notifications distantes sans nouvelle démarche.
- 🔁 En 2027 (projet RNCP), identité dédiée `SistersMade` à créer.

---

## ADR-009 — Stratégie de branches, conventions de commit et suivi des tickets

**Contexte.** SistersMade devient le projet de fin d'études RNCP 7 (2027). L'historique Git doit montrer une méthode de travail d'équipe, même en développant seule.

**Décision.**
- **Git flow allégé** :
  - `main` : versions stables uniquement, taguées (`v0.1.0` = soutenance mobile) ;
  - `develop` : branche d'intégration, branche par défaut sur GitHub ;
  - `feature/SM-XX-…`, `fix/SM-XX-…`, `docs/SM-XX-…` : une branche par ticket, créée depuis `develop`, fusionnée par Pull Request.
- **Conventional Commits** : `type(scope): description [SM-XX]`, avec `type` ∈ feat, fix, docs, chore, refactor, test, style.
- **Tickets Notion** (base « Tickets SistersMade ») : identifiant `SM-XX`, reporté dans la branche, le commit et la PR.
- Pas de branches `release/` ni `hotfix/` à ce stade : réévaluation pour le projet RNCP.

**Conséquences.**
- ✅ Chaque ligne de code remonte à un ticket, donc à un besoin.
- ✅ Les PR documentent le *pourquoi* des changements.
- ℹ️ Les 3 premiers commits (`cd6f4da`, `2ebb9d9`, `dd58fe8`) sont antérieurs à la convention : l'historique n'est pas réécrit.

---

## ADR-010 — Hors-ligne : « stale-while-revalidate » maison (amende ADR-005)

**Contexte.** L'ADR-005 prévoyait TanStack Query pour le cache et le hors-ligne. Mais la liste des demandes repose sur `onSnapshot` (temps réel Firestore), qui pousse lui-même les mises à jour : TanStack Query est pensé pour des requêtes ponctuelles qu'on relance (`invalidateQueries`), pas pour un flux continu. L'obligation « offline » de la grille impose surtout d'afficher des données sans réseau, et d'informer l'utilisatrice.

**Décision.**
- Stratégie **stale-while-revalidate** dans le hook `useDemandes` : la dernière liste enregistrée (AsyncStorage, `services/cache-demandes.ts`) s'affiche tout de suite, puis est remplacée par la réponse de Firestore.
- **Hors ligne** (`services/connexion.ts` + `useConnexion`, via NetInfo) : les réponses de Firestore sont ignorées (elles viennent de sa mémoire et peuvent être vides : elles écraseraient le cache) ; bandeau explicatif ; actions d'écriture (publier, se proposer) désactivées, car une écriture Firestore hors ligne resterait en attente sans fin.
- Le cache est relu en `unknown` et validé par type guards (jamais de `as Demande[]`).
- TanStack Query n'est **pas** utilisé dans le MVP.

**Conséquences.**
- ✅ Obligation « offline » remplie sans nouvelle dépendance ; ouverture instantanée de l'accueil, même en ligne.
- ✅ Même motif « observateur » que la session (`ecouterSession`, `ecouterDemandes`, `ecouterConnexion`).
- ⚠️ Pas de file d'actions hors ligne (SM-22, reportée) : on ne peut ni publier ni aider sans réseau.
- ⚠️ Au retour du réseau, si rien n'a changé côté serveur, Firestore ne renvoie pas forcément de réponse : la liste du cache reste affichée (identique).
- **À revalider si** : de nouveaux écrans font des lectures ponctuelles (détail d'une demande, Mon espace) → TanStack Query redevient pertinent pour ces requêtes.

---

## ADR-011 — Thème centralisé et accessible

**Contexte.** La grille note le *theming* et la qualité des composants ; la charte du projet impose des contrastes AA en clair et en sombre, et jamais d'information par la couleur seule.

**Décision.**
- Toutes les couleurs dans `constants/theme.ts`, lues via le hook `useTheme()` ; aucune couleur codée en dur dans les composants.
- Clés nommées par **rôle** (`primary`, `action`), pas par couleur ; couleurs **`onPrimary` / `onAction`** pour le texte posé sur un bouton (le bouton s'éclaircit en sombre, le texte s'assombrit).
- Chaque paire texte / fond vérifiée par calcul de contraste WCAG (≥ 4,5:1).
- Titres en **Special Elite** (Google Fonts, licence Apache 2.0, accents français vérifiés), chargée par `useFonts` avec dégradation gracieuse ; texte courant en police système (lisibilité, dyslexie).
- Pas de bibliothèque d'UI : le thème s'applique à nos propres composants.

**Conséquences.**
- ✅ Changer une valeur du thème repeint toute l'appli sans toucher un écran.
- ✅ Contraste garanti dans les deux modes.
- ⚠️ La police du logo (Dream Home, démo « usage personnel ») n'est pas utilisée dans l'appli ; le logo lui-même devra être relicencié ou redessiné avant un lancement réel.
- **À revalider si** : passe de design en 2027 (illustrations, couleur d'action).

---

## ADR-012 — Tâche de fond : rafraîchir le cache hors-ligne

**Contexte.** La grille exige au moins une tâche en arrière-plan. Le cache de l'ADR-010 n'est mis à jour que lorsque l'appli est ouverte en ligne.

**Décision.**
- `expo-background-task` + `expo-task-manager` (installés au gel natif, plugin déclaré dans `app.json`).
- La tâche (`services/tache-de-fond.ts`) est définie à la portée globale du module, importé au démarrage ; planifiée avec un intervalle minimal de 30 min.
- À chaque réveil : attendre que Firebase ait relu la session (sinon les règles refusent la lecture), charger la liste une fois (`chargerDemandes`, même requête que l'écoute grâce à `requeteListe()`), l'enregistrer dans le cache.
- « Best effort » : sans effet dans Expo Go (module absent), échecs ignorés.

**Conséquences.**
- ✅ À l'ouverture hors ligne, les demandes affichées sont récentes.
- ⚠️ iOS décide du moment réel (batterie, usage) : `minimumInterval` est un minimum, pas une promesse.
- ⚠️ Non testable dans Expo Go ni déclenchable à la demande dans un build de production : vérification par le code et par Réglages iOS → Actualisation en arrière-plan.