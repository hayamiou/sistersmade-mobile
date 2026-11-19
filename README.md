# SistersMade 🤝

**Entraide locale entre femmes, fondée sur une banque de temps.**
Une heure de service rendu vaut une heure, quel que soit le service : **le temps est la monnaie**.
Une *safe place*, inclusive au maximum.

> Projet mobile — Mastère Expert Développement, Ynov Bordeaux (soutenance du 20/11/2026).
> Il deviendra le projet de fin d'études RNCP 7 (version web + mobile, 2027).

---

## ✨ Fonctionnalités

- **Compte** : inscription et connexion par e-mail, session conservée entre deux lancements, pseudo plutôt que prénom.
- **Demandes d'entraide** : publier une demande (10 catégories, dont « 🤝 Pas toute seule »), durée estimée, commune facultative.
- **Crédit mutuel** : solde de départ à 0 h, découvert autorisé jusqu'à −2 h — vérifié par l'appli **et** par le serveur.
- **Liste en temps réel** : une demande publiée apparaît chez toutes, sans rafraîchir.
- **Geste « Je peux aider »** : glisser une demande vers la droite, ou toucher le bouton équivalent.
- **Commune** : par position approximative (API Géo) ou saisie manuelle — jamais de coordonnées GPS enregistrées.
- **Hors-ligne** : dernière liste enregistrée sur le téléphone, bandeau explicatif, actions désactivées sans réseau.
- **Tâche de fond** : le cache est rafraîchi en arrière-plan.
- **Thème** clair et sombre, contrastes AA vérifiés ; tout l'écran est lisible par **VoiceOver**.

## 🧱 Stack

Expo SDK 58 · React Native 0.88 · TypeScript strict · Expo Router (routes typées) · Firebase JS SDK 13 (Auth + Firestore) · react-native-gesture-handler · expo-location · NetInfo · AsyncStorage · expo-background-task · EAS Build / EAS Update · npm.

## 🗂️ Architecture

```
src/
  app/              écrans (Expo Router) : (auth) connexion / inscription, (tabs) accueil, publier
  components/       composants réutilisables : ui/ (Bouton, ChampTexte, Puce, MessageErreur), demandes/
  constants/        thème (couleurs, police des titres), règles de la banque de temps
  contexts/         AuthProvider + useAuth (session)
  hooks/            hooks custom : useDemandes, useConnexion, useTheme
  services/         SEULE couche qui parle au monde extérieur : Firebase, API Géo,
                    localisation, cache, réseau, tâche de fond (ADR-001)
  types/            types métier sans Firebase (dates en Date)
firestore.rules     règles de sécurité (le serveur ne fait jamais confiance au client)
docs/               décisions (ADR), suivi, déploiement
```

Principes : jamais de `any` (`unknown` + type guards pour toute donnée externe), composants purs, hooks custom, aucune couleur en dur (thème), chaque fonctionnalité livrée **avec** ses règles Firestore.

## ▶️ Lancer le projet en local

```bash
npm install
cp .env.example .env      # puis renseigner les variables EXPO_PUBLIC_FIREBASE_*
npx expo start            # sous WSL, si l'iPhone ne se connecte pas : npx expo start --tunnel
```

Scanner le QR code avec l'iPhone (application **Expo Go**).
Limites d'Expo Go : la tâche de fond n'y fonctionne pas (build nécessaire).

Vérification des types (bloquante avant chaque commit) :

```bash
npx tsc --noEmit
```

## 🚀 Déploiement

Build iOS en distribution interne et mises à jour OTA avec EAS : voir **[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)**.

## ♿ Accessibilité

Exigence de **chaque écran** (Définition de « Terminé ») : libellés VoiceOver partout, erreurs annoncées, contrastes AA en clair et en sombre, jamais d'information par la couleur seule, zones tactiles ≥ 44 pt, une alternative par bouton à chaque geste, saisie manuelle de la commune si la localisation est refusée.

## 📚 Documentation

- [docs/DECISIONS.md](docs/DECISIONS.md) — décisions d'architecture (ADR-001 à ADR-012)
- [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) — build, mises à jour OTA, règles Firestore, recette
- [docs/SUIVI.md](docs/SUIVI.md) — journal de suivi

## Contribuer

1. Prendre un ticket `SM-XX` dans Notion et le passer en « En cours ».
2. Créer la branche depuis `develop` : `git switch develop && git pull && git switch -c feature/SM-XX-description`.
3. Committer au format Conventional Commits : `feat(auth): inscription par e-mail [SM-10]`.
4. Pousser, ouvrir une Pull Request vers `develop`, passer le ticket en « En revue ».
5. Après fusion : ticket « Terminé », branche supprimée.

Voir `docs/DECISIONS.md` (ADR-009) pour le détail.