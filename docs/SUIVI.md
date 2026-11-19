# Suivi — SistersMade mobile

## État (lundi 16/11, midi)
- [x] Projet créé : Expo SDK 58, React Native 0.88, TypeScript strict, Expo Router
- [x] Appli d'exemple testée dans Expo Go (iPhone)
- [x] 8 décisions documentées (docs/DECISIONS.md)
- [ ] Dépôt GitHub
- [ ] Firebase (projet, Auth, Firestore)
- [ ] Structure src/ + thème
- [ ] Liste figée des modules natifs → build de développement (attend le profil du prof)

## Plan
- Lundi : socle (structure, thème, Firebase, docs) — build dès que le profil est prêt
- Mardi : authentification, navigation, publier / lister / voir une demande, règles Firestore
- Mercredi : localisation + API Géo, QR + solde d'heures, offline, tâche de fond
- Jeudi : animation/geste, accessibilité, README + doc de déploiement, build de prod, support
- Vendredi : répétition + soutenance

## Questions ouvertes
- Prof : bundle identifier + projet EAS ? capacité Push sur l'App ID ? distribution interne = « déployée » ?
- Règles d'un échange (qui scanne qui, nombre d'heures, double confirmation ?)

## Règles du projet
- Jamais `npm audit fix --force` ; dépendances Expo via `npx expo install`
- Aucun `eas build` sans décision explicite (crédits dépassés)
- Jamais d'identifiant Apple dans EAS

## Lundi 16/11 après-midi — Firebase branché
- ✅ Auth e-mail/mot de passe activée, Firestore créé (europe-west9, mode production, base `(default)`)
- ✅ `src/services/firebase.ts` : Auth persistante (AsyncStorage) + Firestore, config via `.env`
- ✅ Testé sur iPhone : log `[firebase] connecté au projet : sistersmade-91aa4`
- ℹ️ `tsconfig.json` : chemin `@firebase/auth` → `index.rn.d.ts` (sinon TS ne voit pas `getReactNativePersistence`)
- ℹ️ `import "@/services/firebase"` temporaire dans `_layout.tsx` (remplacé par le hook d'auth mardi)
- 🧾 Dette : erreur TS dans `src/components/app-tabs.web.tsx` (template Expo, web uniquement)
- 🧾 Dette : 7 vulnérabilités npm, ne PAS faire `npm audit fix --force`

## Mardi 17/11 — méthode, modèle, auth
- ✅ SM-6 : ADR-007 amendé + ADR-009 (Git flow allégé, Conventional Commits, tickets Notion) → PR #1
- ✅ SM-9 : types du domaine (`src/types/categories.ts`, `src/types/modeles.ts`) → PR #2 (squash)
- ✅ Décisions : pseudo, 10 catégories (2 max par demande), crédit mutuel (0 h, découvert −2 h), inclusion & accessibilité dans la Définition de « Terminé »
- 🔄 SM-10 : navigation restructurée (pile racine + groupes `(onglets)` / `(auth)`), `firestore.rules` (utilisatrices), `src/constants/banque-temps.ts`, service `auth.ts`, écran d'inscription
- ℹ️ Grille analysée : swipe obligatoire (SM-24 → P0), composants UI réutilisables (P0), ESLint/Prettier (P1), préparation de la démo (P0)
- ℹ️ Documents de référence (projet Claude) : carnet de bord, analyse du cours et de l'évaluation, prompt de reprise
- 🧾 Temporaire à retirer en SM-12 : lien « → Inscription » dans `(onglets)/index.tsx`, import de Firebase dans `_layout.tsx`

## Mercredi 18/11 — garde et publication
- ✅ SM-11 + SM-40 : connexion, déconnexion, session (`AuthProvider` + `useAuth`), composants UI réutilisables → PR #7
- ✅ SM-12 : garde de navigation (`Stack.Protected` + `redirectTo`) → PR #8
- ℹ️ Examen de fin de majeure (quiz React)
- 🔄 SM-14 : service `demandes.ts`, `ErreurMetier`, règles `demandes`, composant `Puce`, écran `publier`

## Jeudi 19/11 — fonctionnalités et obligations de la grille
- ✅ SM-14 publier une demande → PR #9 · SM-15 liste en temps réel → PR #10
- ✅ 1re mise à jour OTA du build preview (`eas update --channel preview`)
- ✅ SM-24 geste « Je peux aider » → PR #11 + #12
- ✅ SM-17 commune : API Géo + localisation + saisie manuelle → PR #13
- ✅ SM-8 thème (palette AA, titres Special Elite, onglets en français) → PR #14 + #15 — ADR-011
- ✅ SM-21 hors-ligne (cache AsyncStorage, NetInfo, bandeau) → PR #16 — ADR-010
- ✅ SM-23 tâche de fond (rafraîchit le cache) → PR #17 — ADR-012
- 🔄 SM-28 : `docs/DEPLOIEMENT.md`, README, ADR-010 à 012
- 🧾 Dette : découvert vérifié demande par demande (pas le total des demandes ouvertes)
- 🧾 Dette : course entre la garde et l'écriture du profil à l'inscription
- 🧾 Dette : compteur de caractères qui compte les espaces autour du texte
- 🧾 Dette : « Astuce : glisse… » affichée hors ligne alors que le geste est désactivé
- 🧾 Dette : règles Firestore publiées à la main (à automatiser en CI)

## Règles du projet (mise à jour du 19/11)
- Budget build atteint (2 builds preview le 17/11) : plus de `eas build` sauf nouveau module natif ; le JavaScript part par `eas update`, sur décision explicite
- Déploiement détaillé : voir `docs/DEPLOIEMENT.md`
- Suivi des tickets : Notion, base « Tickets SistersMade » (source de vérité)