/**
 * src/services/demandes.ts
 *
 * RÔLE : tout ce qui touche aux demandes d'entraide dans Firestore.
 * Les écrans appellent validerDemande() / publierDemande() sans savoir
 * que Firebase existe (ADR-001).
 */
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";

import { DECOUVERT_MAX_HEURES } from "@/constants/banque-temps";
import { ErreurMetier } from "@/services/erreurs";
import { db } from "@/services/firebase";
import { estCategorie, NB_MAX_CATEGORIES } from "@/types/categories";
import type { Demande, NouvelleDemande, Uid } from "@/types/modeles";

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