/**
 * src/services/auth.ts
 *
 * RÔLE : tout ce qui touche à l'authentification. C'est le SEUL fichier
 * (avec firebase.ts) qui parle à Firebase Auth : les écrans appellent
 * inscrire(), messageErreur()… sans savoir que Firebase existe (ADR-001).
 */
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { SOLDE_INITIAL } from "@/constants/banque-temps";
import { auth, db } from "@/services/firebase";
import type { Utilisatrice } from "@/types/modeles";

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
  // Erreur Firestore (pas de préfixe « auth/ ») : règles de sécurité.
  "permission-denied": "Le serveur a refusé l'opération.",
};

/** Transforme n'importe quelle erreur en phrase lisible pour l'utilisatrice. */
export function messageErreur(erreur: unknown): string {
  if (erreur instanceof FirebaseError) {
    // On garde le code entre parenthèses pour nous aider à déboguer.
    return MESSAGES[erreur.code] ?? `Une erreur est survenue (${erreur.code}).`;
  }
  return "Une erreur inattendue est survenue.";
}