/**
 * src/types/categories.ts
 *
 * RÔLE : la liste OFFICIELLE des catégories de SistersMade.
 *
 * PRINCIPE « UNE SEULE SOURCE DE VÉRITÉ » :
 * la liste est écrite UNE fois ici. Le type `Categorie`, les libellés,
 * les emojis et les validations en sont tous DÉDUITS. Ajouter une catégorie
 * = ajouter UNE ligne ci-dessous, TypeScript répercute partout.
 *
 * Le `code` est ce qui est stocké dans Firestore : il ne doit JAMAIS changer
 * (sinon les anciennes demandes pointeraient vers une catégorie inconnue).
 * Le `libelle` et l'`emoji`, eux, peuvent évoluer librement.
 */

export const CATEGORIES = [
  { code: "pas_seule", libelle: "Pas toute seule", emoji: "🤝" },
  { code: "paperasse", libelle: "Paperasse & droits", emoji: "📑" },
  { code: "carriere", libelle: "Carrière & reconversion", emoji: "🚀" },
  { code: "argent", libelle: "Argent & autonomie", emoji: "💸" },
  { code: "numerique", libelle: "Numérique & sécurité", emoji: "🔐" },
  { code: "reparer", libelle: "Réparer & monter", emoji: "🛠️" },
  { code: "relais", libelle: "Relais du quotidien", emoji: "🫶" },
  { code: "apprendre", libelle: "Apprendre & transmettre", emoji: "🎓" },
  { code: "bouger", libelle: "Bouger ensemble", emoji: "🏃‍♀️" },
  { code: "sortir", libelle: "Sortir ensemble", emoji: "🎶" },
] as const;

/**
 * Le type `Categorie` est CALCULÉ à partir de la liste :
 * "pas_seule" | "paperasse" | ... | "sortir".
 * `(typeof CATEGORIES)[number]` = « le type d'un élément du tableau »,
 * puis `["code"]` = « le type de son champ code ».
 */
export type Categorie = (typeof CATEGORIES)[number]["code"];

/** Une demande a 1 à 2 catégories ; la première est la principale (icône affichée). */
export const NB_MAX_CATEGORIES = 2;

/** Les codes seuls, pratiques pour les validations. */
export const CODES_CATEGORIES: readonly Categorie[] = CATEGORIES.map((c) => c.code);

/**
 * Vérifie qu'une chaîne venue de l'extérieur (Firestore, paramètre de route…)
 * est bien une catégorie connue.
 * `valeur is Categorie` est un « type guard » : après un `if (estCategorie(x))`,
 * TypeScript SAIT que x est une Categorie.
 */
export function estCategorie(valeur: string): valeur is Categorie {
  return (CODES_CATEGORIES as readonly string[]).includes(valeur);
}

/** Libellé + emoji d'une catégorie, pour l'affichage. */
export function infosCategorie(code: Categorie) {
  const info = CATEGORIES.find((c) => c.code === code);
  // Impossible en théorie (code est typé), mais `find` peut renvoyer undefined :
  // on échoue bruyamment plutôt que d'afficher une case vide.
  if (!info) throw new Error(`Catégorie inconnue : ${code}`);
  return info;
}
Étape 3 : coller dans modeles.ts, puis Ctrl+S
ts
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