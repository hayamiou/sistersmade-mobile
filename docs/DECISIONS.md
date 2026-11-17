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
