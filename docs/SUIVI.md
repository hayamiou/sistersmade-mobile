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
