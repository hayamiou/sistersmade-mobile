/**
 * src/services/firebase.ts
 *
 * RÔLE : initialiser Firebase UNE seule fois et exposer deux objets :
 *   - `auth` : l'authentification (comptes, connexion)
 *   - `db`   : la base Firestore
 *
 * RÈGLE D'ARCHITECTURE (ADR-001) : c'est le SEUL endroit qui configure Firebase.
 * Les écrans n'importent jamais Firebase ; ils passent par des hooks
 * (ex. useDemandes) qui s'appuient sur des services. Si on change de backend
 * en 2027 (ex. API Spring), on ne réécrit que la couche services.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Vérifie qu'une variable d'environnement est bien définie.
 * Sans ce contrôle, un .env incomplet donnerait une erreur Firebase obscure
 * bien plus loin ; ici l'erreur dit exactement quoi corriger.
 */
function exiger(nom: string, valeur: string | undefined): string {
  if (!valeur) {
    throw new Error(`Variable d'environnement manquante : ${nom}. Vérifie le fichier .env`);
  }
  return valeur;
}

/**
 * Configuration lue depuis .env.
 * PIÈGE : Expo remplace `process.env.EXPO_PUBLIC_XXX` par sa valeur AU MOMENT
 * DU BUNDLE, et seulement si le nom est écrit en entier. Un accès dynamique
 * (process.env[nom]) ne fonctionnerait PAS : d'où un nom écrit par ligne.
 * NB : les variables EXPO_PUBLIC_* finissent dans l'appli, elles ne sont donc
 * pas secrètes. Ce n'est pas grave ici : la clé Firebase identifie le projet,
 * la sécurité repose sur les règles Firestore.
 */
const firebaseConfig = {
  apiKey: exiger("EXPO_PUBLIC_FIREBASE_API_KEY", process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: exiger("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: exiger("EXPO_PUBLIC_FIREBASE_PROJECT_ID", process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: exiger("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: exiger(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: exiger("EXPO_PUBLIC_FIREBASE_APP_ID", process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

/**
 * Une seule instance de l'appli Firebase.
 * Avec le Fast Refresh, ce fichier peut être ré-exécuté : on réutilise
 * l'instance existante au lieu d'en créer une deuxième (ce qui planterait).
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Authentification avec PERSISTANCE : la session est enregistrée dans
 * AsyncStorage, donc l'utilisatrice reste connectée après avoir fermé l'appli.
 * (Le getAuth() du web n'enregistre rien sur mobile.)
 * initializeAuth ne peut être appelé qu'une fois : en cas de Fast Refresh,
 * il lève une erreur, et on récupère alors l'instance déjà créée.
 */
function creerAuth(): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

export const auth = creerAuth();
export const db = getFirestore(app);

// Trace en développement uniquement : confirme que la bonne config est chargée.
if (__DEV__) {
  console.log("[firebase] connecté au projet :", app.options.projectId);
}