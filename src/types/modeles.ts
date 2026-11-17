/**
 * src/types/modeles.ts
 *
 * RÔLE : la forme des données de SistersMade, telle que l'APPLI la manipule.
 *
 * Collections Firestore correspondantes (droits appliqués par les règles, SM-13) :
 *   utilisatrices/{uid}  ✏️ elle-même (sauf soldeHeures et verification 🔒)
 *   demandes/{id}        ✏️ l'autrice seule · 👀 toute utilisatrice connectée
 *   echanges/{id}        🔒 créés uniquement par la transaction d'échange QR
 *
 * RÈGLE D'ARCHITECTURE (ADR-001) : ce fichier n'importe RIEN de Firebase.
 * Les dates sont des `Date` JavaScript ; c'est la couche services qui convertit
 * les `Timestamp` Firestore en `Date` (et inversement). Les écrans ignorent
 * donc tout de Firebase.
 */
import type { Categorie } from "./categories";

/** Identifiant d'utilisatrice = identifiant Firebase Auth. Alias pour la lisibilité. */
export type Uid = string;

/**
 * Localisation APPROXIMATIVE : une commune, jamais des coordonnées GPS (ADR-002).
 * codeInsee = identifiant officiel de la commune (fourni par geo.api.gouv.fr).
 */
export interface Commune {
  nom: string;
  codeInsee: string;
}

export type StatutVerification = "non_verifiee" | "en_cours" | "verifiee";

/** Document `utilisatrices/{uid}` : le profil. */
export interface Utilisatrice {
  /** = id du document Firestore (pas un champ stocké dedans). */
  uid: Uid;
  /** Pseudo plutôt que prénom : vie privée. Non unique pour le MVP. */
  pseudo: string;
  bio: string | null;
  /** Ce qu'elle peut offrir, avec les mêmes catégories que les demandes. */
  competences: Categorie[];
  /** null tant que la localisation n'est pas faite (SM-17, mercredi). */
  commune: Commune | null;
  /** 🔒 Modifiable UNIQUEMENT par un échange validé (règles Firestore). */
  soldeHeures: number;
  /** 🔒 Jamais modifiable par l'appli : prépare la vérification d'identité (2027). */
  verification: StatutVerification;
  creeLe: Date;
}

/** Cycle de vie : ouverte → en_cours (une aidante s'est proposée) → terminee (échange validé). */
export type StatutDemande = "ouverte" | "en_cours" | "terminee";

/** Document `demandes/{id}` : une demande d'aide. */
export interface Demande {
  id: string;
  autriceId: Uid;
  /**
   * COPIE volontaire du pseudo (dénormalisation) : Firestore ne fait pas de
   * jointures. Sans cette copie, afficher 20 demandes coûterait 20 lectures de plus.
   */
  autricePseudo: string;
  titre: string;
  description: string;
  /** 1 à NB_MAX_CATEGORIES (2). La première = la principale. */
  categories: Categorie[];
  /** Durée estimée, en heures : c'est la « valeur » de la demande. */
  dureeEstimee: number;
  /** Commune de l'autrice au moment de la publication (null avant SM-17). */
  commune: Commune | null;
  statut: StatutDemande;
  /** L'utilisatrice qui s'est proposée pour aider ; null tant que personne. */
  aidanteId: Uid | null;
  creeLe: Date;
}

/**
 * Ce que l'utilisatrice saisit pour publier une demande (SM-14).
 * Tout le reste (id, autrice, statut, dates…) est rempli par l'appli.
 * `Pick` = « je prends seulement ces champs-là de Demande ».
 */
export type NouvelleDemande = Pick<Demande, "titre" | "description" | "categories" | "dureeEstimee">;

/**
 * Document `echanges/{id}` : un échange de temps validé.
 * ❓ Le champ `statut` (double confirmation ?) sera ajouté quand les règles
 * d'échange seront tranchées (SM-18). On n'invente pas avant.
 */
export interface Echange {
  id: string;
  demandeId: string;
  /** Celle qui a rendu service : elle REÇOIT les heures. */
  aidanteId: Uid;
  /** Celle qui a été aidée : elle DONNE les heures. */
  aideeId: Uid;
  heures: number;
  valideLe: Date;
}