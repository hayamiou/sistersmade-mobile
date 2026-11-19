/**
 * src/services/auth.ts
 *
 * RÔLE : tout ce qui touche à l'authentification. C'est le SEUL fichier
 * (avec firebase.ts) qui parle à Firebase Auth : les écrans appellent
 * inscrire(), messageErreur()… sans savoir que Firebase existe (ADR-001).
 */
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { SOLDE_INITIAL } from "@/constants/banque-temps";
import { auth, db } from "@/services/firebase";
import type { Uid, Utilisatrice } from "@/types/modeles";
import { ErreurMetier } from "@/services/erreurs";

/** Ce que l'écran d'inscription transmet. */
export interface DonneesInscription {
  pseudo: string;
  email: string;
  motDePasse: string;
}

/* ------------------------------------------------------------------ */
/* VALIDATION — règles identiques à firestore.rules (2 à 30 caractères) */
/* ------------------------------------------------------------------ */

export const PSEUDO_MIN = 2;
export const PSEUDO_MAX = 30;
/** Firebase accepte 6 caractères ; on exige 8, recommandation courante. */
export const MOT_DE_PASSE_MIN = 8;

/**
 * Vérifie le formulaire AVANT d'appeler le serveur.
 * Renvoie un message d'erreur lisible, ou null si tout est bon.
 * NB : c'est du CONFORT (retour immédiat). La vraie protection, ce sont
 * les règles Firestore : on ne fait jamais confiance au client.
 */
export function validerInscription(d: DonneesInscription): string | null {
  const pseudo = d.pseudo.trim();
  if (pseudo.length < PSEUDO_MIN || pseudo.length > PSEUDO_MAX) {
    return `Ton pseudo doit faire entre ${PSEUDO_MIN} et ${PSEUDO_MAX} caractères.`;
  }
  // Vérification volontairement simple : Firebase fera la vraie validation.
  if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) {
    return "Cette adresse e-mail n'a pas l'air valide.";
  }
  if (d.motDePasse.length < MOT_DE_PASSE_MIN) {
    return `Ton mot de passe doit faire au moins ${MOT_DE_PASSE_MIN} caractères.`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* INSCRIPTION                                                         */
/* ------------------------------------------------------------------ */

/**
 * Crée le compte (Firebase Auth) PUIS le profil (Firestore).
 *
 * Deux opérations dans deux services différents : si la 2e échoue, on aurait
 * un compte SANS profil (état incohérent). D'où le « retour arrière » :
 * en cas d'échec du profil, on supprime le compte qui vient d'être créé.
 */
export async function inscrire({ pseudo, email, motDePasse }: DonneesInscription): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), motDePasse);

  // Typé avec le modèle : si un champ manque ou est mal écrit, TypeScript refuse.
  // (uid = id du document, creeLe = date serveur : ajoutés à part.)
  const profil: Omit<Utilisatrice, "uid" | "creeLe"> = {
    pseudo: pseudo.trim(),
    bio: null,
    competences: [],
    commune: null, // renseignée avec la localisation (SM-17)
    soldeHeures: SOLDE_INITIAL,
    verification: "non_verifiee",
  };

  try {
    await setDoc(doc(db, "utilisatrices", user.uid), {
      ...profil,
      // Date posée par le SERVEUR (l'heure du téléphone n'est pas fiable).
      creeLe: serverTimestamp(),
    });
  } catch (erreur) {
    // Retour arrière : on ne laisse pas un compte orphelin.
    // .catch(() => {}) : si la suppression échoue aussi, on remonte quand
    // même l'erreur d'origine, plus utile pour comprendre.
    await deleteUser(user).catch(() => {});
    throw erreur;
  }
}

/* ------------------------------------------------------------------ */
/* MESSAGES D'ERREUR EN FRANÇAIS                                       */
/* ------------------------------------------------------------------ */

const MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Cette adresse e-mail est déjà utilisée.",
  "auth/invalid-email": "Cette adresse e-mail n'est pas valide.",
  "auth/weak-password": "Ce mot de passe est trop faible.",
  "auth/network-request-failed": "Pas de connexion internet. Réessaie dans un instant.",
  "auth/too-many-requests": "Trop de tentatives. Patiente quelques minutes.",
    "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
  "auth/user-disabled": "Ce compte a été suspendu. Contacte l'équipe SistersMade.",
  // Erreur Firestore (pas de préfixe « auth/ ») : règles de sécurité.
  "permission-denied": "Le serveur a refusé l'opération.",
};

/** Transforme n'importe quelle erreur en phrase lisible pour l'utilisatrice. */
export function messageErreur(erreur: unknown): string {
  if (erreur instanceof FirebaseError) {
    // On garde le code entre parenthèses pour nous aider à déboguer.
    return MESSAGES[erreur.code] ?? `Une erreur est survenue (${erreur.code}).`;
  }
  if (erreur instanceof ErreurMetier) {
    return erreur.message; // message déjà écrit pour l'utilisatrice
  }
  return "Une erreur inattendue est survenue.";
}

/* ------------------------------------------------------------------ */
/* CONNEXION / DÉCONNEXION / SESSION                                  */
/* ------------------------------------------------------------------ */

/**
 * NOTRE représentation d'une session : volontairement minimale.
 * On n'expose PAS le type `User` de Firebase au reste de l'appli (ADR-001) :
 * si demain on change de fournisseur d'auth, seuls les services bougent.
 */
export interface Session {
  uid: Uid;
  email: string | null;
}

/** Ce que l'écran de connexion transmet. */
export interface DonneesConnexion {
  email: string;
  motDePasse: string;
}

/**
 * Validation locale minimale : on vérifie juste que rien n'est vide.
 * Pas de règle de longueur ici : c'est Firebase qui dira si le couple
 * e-mail / mot de passe est bon. Retourne un message, ou null si OK.
 */
export function validerConnexion({ email, motDePasse }: DonneesConnexion): string | null {
  if (email.trim() === "") return "Indique ton adresse e-mail.";
  if (motDePasse === "") return "Indique ton mot de passe.";
  return null;
}

/** Connecte l'utilisatrice. Lève une erreur Firebase en cas d'échec (→ messageErreur). */
export async function seConnecter({ email, motDePasse }: DonneesConnexion): Promise<void> {
  // trim() sur l'e-mail seulement : un espace dans un mot de passe est un vrai caractère.
  await signInWithEmailAndPassword(auth, email.trim(), motDePasse);
}

/** Déconnecte l'utilisatrice (la session persistée dans AsyncStorage est effacée). */
export async function seDeconnecter(): Promise<void> {
  await signOut(auth);
}

/**
 * S'abonne aux changements de session (connexion, déconnexion, réouverture
 * de l'appli avec une session persistée).
 * - Le rappel reçoit NOTRE type Session (ou null), jamais le User Firebase.
 * - Retourne la fonction de désabonnement : à appeler au démontage
 *   (c'est exactement ce qu'attend le return d'un useEffect).
 */
export function ecouterSession(rappel: (session: Session | null) => void): () => void {
  return onAuthStateChanged(auth, (utilisateur) => {
    rappel(utilisateur ? { uid: utilisateur.uid, email: utilisateur.email } : null);
  });
}