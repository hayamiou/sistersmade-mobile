/**
 * src/services/cache-demandes.ts
 *
 * Cache LOCAL de la dernière liste de demandes reçue (SM-21, hors-ligne).
 * Stockée sur le téléphone avec AsyncStorage : à l'ouverture de l'appli,
 * même sans réseau, on peut afficher les dernières demandes connues.
 *
 * Vit dans src/services/ : AsyncStorage est un système EXTÉRIEUR à l'appli,
 * comme Firebase — les écrans et les hooks n'en savent rien.
 *
 * Règle du cours : ce qu'on relit du stockage est une donnée externe →
 * JSON.parse renvoie du « unknown » qu'on vérifie champ par champ (type guard),
 * jamais un « as Demande[] » aveugle. Un cache abîmé ou d'une ancienne version
 * est simplement ignoré, au lieu de faire planter l'écran.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import { CATEGORIES, type Categorie } from "@/types/categories";
import type { Commune, Demande, StatutDemande } from "@/types/modeles";

// « v1 » dans la clé : si le format change un jour, on passe à v2
// et l'ancien cache est tout simplement ignoré.
const CLE_CACHE = "sistersmade:demandes:v1";

const STATUTS: readonly string[] = ["ouverte", "en_cours", "terminee"];
const CODES_CATEGORIES: readonly string[] = CATEGORIES.map((c) => c.code);

/**
 * Enregistre la liste. « Best effort » : si le stockage échoue (mémoire pleine…),
 * l'appli continue normalement — le cache est un confort, pas une obligation.
 */
export async function enregistrerDemandes(demandes: Demande[]): Promise<void> {
  try {
    // JSON.stringify transforme chaque Date en texte ISO (« 2026-11-19T18:00:00.000Z »).
    await AsyncStorage.setItem(CLE_CACHE, JSON.stringify(demandes));
  } catch {
    // Volontairement silencieux : rien à montrer à l'utilisatrice.
  }
}

/** Relit la dernière liste enregistrée ; null s'il n'y en a pas (ou si elle est illisible). */
export async function lireDemandes(): Promise<Demande[] | null> {
  try {
    const texte = await AsyncStorage.getItem(CLE_CACHE);
    if (texte === null) return null;

    const donnees: unknown = JSON.parse(texte);
    if (!Array.isArray(donnees)) return null;

    // flatMap : chaque élément valide donne [demande], chaque élément abîmé donne [] (ignoré).
    return donnees.flatMap((element) => {
      const demande = versDemande(element);
      return demande ? [demande] : [];
    });
  } catch {
    return null; // JSON corrompu ou stockage indisponible : on fait comme s'il n'y avait pas de cache.
  }
}

// ---------------------------------------------------------------------------
// Type guards : on reconstruit une Demande à partir d'un « unknown »
// ---------------------------------------------------------------------------

function estObjet(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function estStatut(x: unknown): x is StatutDemande {
  return typeof x === "string" && STATUTS.includes(x);
}

function estCategorie(x: unknown): x is Categorie {
  return typeof x === "string" && CODES_CATEGORIES.includes(x);
}

/** Commune valide → Commune ; null → null ; forme inattendue → undefined (= invalide). */
function versCommune(x: unknown): Commune | null | undefined {
  if (x === null) return null;
  if (estObjet(x) && typeof x.nom === "string" && typeof x.codeInsee === "string") {
    return { nom: x.nom, codeInsee: x.codeInsee };
  }
  return undefined;
}

function versDemande(x: unknown): Demande | null {
  if (!estObjet(x)) return null;

  const commune = versCommune(x.commune);
  // La date revient du stockage sous forme de texte : on la reconvertit en Date.
  const creeLe = typeof x.creeLe === "string" ? new Date(x.creeLe) : null;

  if (
    typeof x.id !== "string" ||
    typeof x.autriceId !== "string" ||
    typeof x.autricePseudo !== "string" ||
    typeof x.titre !== "string" ||
    typeof x.description !== "string" ||
    typeof x.dureeEstimee !== "number" ||
    !Array.isArray(x.categories) ||
    !x.categories.every(estCategorie) ||
    !estStatut(x.statut) ||
    !(x.aidanteId === null || typeof x.aidanteId === "string") ||
    commune === undefined ||
    creeLe === null ||
    Number.isNaN(creeLe.getTime())
  ) {
    return null;
  }

  return {
    id: x.id,
    autriceId: x.autriceId,
    autricePseudo: x.autricePseudo,
    titre: x.titre,
    description: x.description,
    categories: x.categories,
    dureeEstimee: x.dureeEstimee,
    commune,
    statut: x.statut,
    aidanteId: x.aidanteId,
    creeLe,
  };
}