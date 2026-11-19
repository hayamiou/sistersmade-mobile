/**
 * src/services/biometrie.ts
 *
 * Face ID / Touch ID (SM-45, fonctionnalité native n°2) via expo-local-authentication.
 * Comme tout ce qui parle au matériel, seul ce service connaît le module.
 *
 * Choix de sécurité ET d'accessibilité : on laisse iOS proposer le CODE de
 * l'iPhone si le visage n'est pas reconnu (masque, lunettes, handicap…).
 * C'est l'« alternative » de notre charte, gérée par le système.
 */
import * as LocalAuthentication from "expo-local-authentication";

/** true si l'appareil a la biométrie ET qu'elle est configurée par l'utilisatrice. */
export async function biometrieDisponible(): Promise<boolean> {
  try {
    const materiel = await LocalAuthentication.hasHardwareAsync();
    const configuree = await LocalAuthentication.isEnrolledAsync();
    return materiel && configuree;
  } catch {
    return false; // dans le doute, on ne bloque personne
  }
}

/** Affiche la demande Face ID d'iOS. true si l'utilisatrice est reconnue. */
export async function authentifier(): Promise<boolean> {
  try {
    const resultat = await LocalAuthentication.authenticateAsync({
      promptMessage: "Déverrouiller SistersMade",
      cancelLabel: "Annuler",
      fallbackLabel: "Utiliser le code",
    });
    return resultat.success;
  } catch {
    return false;
  }
}