/**
 * src/services/demandes.ts
 *
 * RÔLE : tout ce qui touche aux demandes d'entraide dans Firestore.
 * Les écrans appellent validerDemande() / publierDemande() sans savoir
 * que Firebase existe (ADR-001).
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { DECOUVERT_MAX_HEURES } from "@/constants/banque-temps";
import { ErreurMetier } from "@/services/erreurs";
import { db } from "@/services/firebase";
import { estCategorie, NB_MAX_CATEGORIES } from "@/types/categories";
import type { Commune, Demande, NouvelleDemande, StatutDemande, Uid } from "@/types/modeles";

/* ------------------------------------------------------------------ */
/* RÈGLES MÉTIER — identiques à firestore.rules (à garder synchronisées) */
/* ------------------------------------------------------------------ */

export const TITRE_MIN = 5;
export const TITRE_MAX = 80;
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 1000;

/** Durées proposées, en heures. Liste fermée : simple à choisir, simple à vérifier. */
export const DUREES_POSSIBLES = [0.5, 1, 1.5, 2, 3, 4, 8] as const;

/** Affichage lisible d'une durée : 0.5 → « 30 min », 1.5 → « 1 h 30 ». */
export function libelleDuree(heures: number): string {
  const h = Math.floor(heures);
  const min = Math.round((heures - h) * 60);
  if (h === 0) return `${min} min`;
  return min === 0 ? `${h} h` : `${h} h ${min}`;
}

/**
 * Validation locale, avant tout appel réseau.
 * Retourne un message à afficher (formulé en « quoi faire »), ou null si OK.
 */
export function validerDemande(d: NouvelleDemande): string | null {
  const titre = d.titre.trim();
  const description = d.description.trim();

  if (titre.length < TITRE_MIN || titre.length > TITRE_MAX) {
    return `Donne un titre de ${TITRE_MIN} à ${TITRE_MAX} caractères.`;
  }
  if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) {
    return `Décris ton besoin en ${DESCRIPTION_MIN} à ${DESCRIPTION_MAX} caractères.`;
  }
  if (d.categories.length < 1 || d.categories.length > NB_MAX_CATEGORIES) {
    return `Choisis 1 ou ${NB_MAX_CATEGORIES} catégories.`;
  }
  // Ceinture + bretelles : le type garantit déjà des catégories valides,
  // mais on revérifie à l'exécution (les données peuvent venir d'ailleurs).
  if (!d.categories.every(estCategorie)) {
    return "Une des catégories n'existe pas.";
  }
  if (!DUREES_POSSIBLES.some((duree) => duree === d.dureeEstimee)) {
    return "Choisis une durée estimée.";
  }
  return null;
}

/**
 * Publie une demande. Retourne son identifiant.
 *
 * Le pseudo est RELU dans le profil (et non transmis par l'écran) :
 * les règles Firestore vérifient de leur côté qu'il correspond,
 * donc impossible de publier sous le pseudo d'une autre.
 */
export async function publierDemande(autriceId: Uid, d: NouvelleDemande): Promise<string> {
  const profil = await getDoc(doc(db, "utilisatrices", autriceId));
  // unknown + vérification : on ne fait pas confiance à la forme du document.
  const pseudo: unknown = profil.data()?.pseudo;
  if (typeof pseudo !== "string") {
    throw new ErreurMetier("Ton profil est introuvable. Déconnecte-toi puis reconnecte-toi.");
  }
  
  // Crédit mutuel : après l'échange, le solde de l'autrice ne doit pas
  // descendre sous -DECOUVERT_MAX_HEURES. On prévient DÈS la publication,
  // plutôt qu'au moment où une voisine a déjà donné son temps.
  const solde: unknown = profil.data()?.soldeHeures;
  if (typeof solde !== "number") {
    throw new ErreurMetier("Ton solde est introuvable. Déconnecte-toi puis reconnecte-toi.");
  }
  const maximum = solde + DECOUVERT_MAX_HEURES;
  if (d.dureeEstimee > maximum) {
    throw new ErreurMetier(
      `Avec ton solde actuel, tu peux demander jusqu'à ${libelleDuree(Math.max(maximum, 0))}. ` +
        "Rends service pour gagner des heures !",
    );
  }

  // Omit : tous les champs de Demande sauf ceux que Firestore fournit
  // (id = identifiant du document, creeLe = horodatage serveur).
  const donnees: Omit<Demande, "id" | "creeLe"> = {
    autriceId,
    autricePseudo: pseudo, // copie volontaire (dénormalisation, voir le carnet)
    titre: d.titre.trim(),
    description: d.description.trim(),
    categories: d.categories,
    dureeEstimee: d.dureeEstimee,
    commune: null, // remplie par SM-17 (localisation + API Géo)
    statut: "ouverte",
    aidanteId: null,
  };

  const ref = await addDoc(collection(db, "demandes"), {
    ...donnees,
    creeLe: serverTimestamp(), // l'heure du SERVEUR, pas celle du téléphone
  });
  return ref.id;
}

/* ------------------------------------------------------------------ */
/* LECTURE — liste des demandes en temps réel                          */
/* ------------------------------------------------------------------ */

/** Nombre maximum de demandes chargées (les plus récentes d'abord). */
const LIMITE_LISTE = 50;

const STATUTS: readonly StatutDemande[] = ["ouverte", "en_cours", "terminee"];

/** Type guard : une valeur venue de Firestore est-elle une Commune valide ? */
function estCommune(v: unknown): v is Commune {
  return (
    typeof v === "object" && v !== null &&
    "nom" in v && typeof v.nom === "string" &&
    "codeInsee" in v && typeof v.codeInsee === "string"
  );
}

/**
 * Convertit un document Firestore en Demande, ou null s'il est mal formé.
 * On ne fait PAS confiance aux données externes (cours, chap. 2) : chaque
 * champ est vérifié, et le Timestamp Firestore devient une Date (ADR-001).
 */
function versDemande(id: string, d: Record<string, unknown>): Demande | null {
  const { autriceId, autricePseudo, titre, description, categories, dureeEstimee, statut, aidanteId, creeLe } = d;
  if (
    typeof autriceId !== "string" ||
    typeof autricePseudo !== "string" ||
    typeof titre !== "string" ||
    typeof description !== "string" ||
    !Array.isArray(categories) || !categories.every(estCategorie) ||
    typeof dureeEstimee !== "number" ||
    !STATUTS.some((s) => s === statut) ||
    !(aidanteId === null || typeof aidanteId === "string") ||
    !(creeLe instanceof Timestamp)
  ) {
    return null;
  }
  return {
    id,
    autriceId,
    autricePseudo,
    titre,
    description,
    categories,
    dureeEstimee,
    commune: estCommune(d.commune) ? d.commune : null,
    statut: statut as StatutDemande, // vérifié juste au-dessus par STATUTS.some
    aidanteId,
    creeLe: creeLe.toDate(),
  };
}
/**
 * S'abonne aux demandes, les plus récentes d'abord, en TEMPS RÉEL :
 * une demande publiée par une voisine apparaît sans rafraîchir.
 * Retourne la fonction de désabonnement (à rendre dans un useEffect).
 */
export function ecouterDemandes(
  surDonnees: (demandes: Demande[]) => void,
  surErreur: (erreur: unknown) => void,
): () => void {
  const q = query(collection(db, "demandes"), orderBy("creeLe", "desc"), limit(LIMITE_LISTE));
  return onSnapshot(
    q,
    (instantane) => {
      const demandes = instantane.docs
        // "estimate" : une demande qu'on vient de publier a déjà une date
        // estimée, en attendant celle du serveur (sinon creeLe serait null).
        .map((document) => versDemande(document.id, document.data({ serverTimestamps: "estimate" })))
        .filter((demande): demande is Demande => demande !== null);
      surDonnees(demandes);
    },
    surErreur,
  );
}

/* ------------------------------------------------------------------ */
/* ACTION — « Je peux aider » (SM-24)                                  */
/* ------------------------------------------------------------------ */

/**
 * Une voisine se propose pour aider : la demande passe « en cours »,
 * avec elle comme aidante. Première étape du cycle de vie d'une demande.
 *
 * Les règles Firestore vérifient côté serveur : demande encore ouverte,
 * sans aidante, pas sa propre demande, et SEULS aidanteId + statut changent.
 */
export async function proposerAide(demande: Demande, aidanteId: Uid): Promise<void> {
  // Contrôles de confort (le serveur, lui, interdira de toute façon).
  if (demande.autriceId === aidanteId) {
    throw new ErreurMetier("C'est ta propre demande : tu ne peux pas t'y proposer.");
  }
  if (demande.statut !== "ouverte" || demande.aidanteId !== null) {
    throw new ErreurMetier("Une autre femme s'est déjà proposée pour cette demande.");
  }

  await updateDoc(doc(db, "demandes", demande.id), {
    aidanteId,
    statut: "en_cours",
  });
}