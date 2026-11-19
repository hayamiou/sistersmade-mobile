/**
 * src/services/localisation.ts
 *
 * Fonction NATIVE n°1 de la grille : la localisation (expo-location).
 * - Permission demandée AU MOMENT DU CLIC, pas au lancement : l'utilisatrice
 *   comprend pourquoi on la demande.
 * - Précision BASSE (quelques kilomètres) : suffisante pour trouver la
 *   commune, et respectueuse de la vie privée (minimisation).
 * - Refus = pas une erreur : on renvoie null, et l'écran propose la saisie
 *   manuelle de la commune (charte d'inclusion : personne n'est exclue).
 */
import * as Location from "expo-location";

import { ErreurMetier } from "@/services/erreurs";

export type Coordonnees = { latitude: number; longitude: number };

/**
 * Demande la permission puis la position approximative.
 * Retourne null si la permission est refusée.
 */
export async function positionApproximative(): Promise<Coordonnees | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return null; // refus respecté : l'écran passera à la saisie manuelle
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low, // ~ quelques km : la commune suffit
    });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    // GPS désactivé, intérieur d'un bâtiment, délai dépassé…
    throw new ErreurMetier("Impossible de trouver ta position. Saisis ta commune à la main.");
  }
}