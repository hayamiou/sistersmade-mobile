/**
 * src/services/connexion.ts
 *
 * État du réseau (SM-21), via NetInfo. Comme Firebase et AsyncStorage,
 * NetInfo est un système extérieur : seul ce service le connaît.
 */
import NetInfo from "@react-native-community/netinfo";

/**
 * S'abonne aux changements de réseau. Le rappel reçoit true si l'appli
 * peut joindre Internet. Renvoie la fonction de désabonnement
 * (même forme que ecouterSession et ecouterDemandes → se branche dans un useEffect).
 */
export function ecouterConnexion(rappel: (enLigne: boolean) => void): () => void {
  return NetInfo.addEventListener((etat) => {
    // isInternetReachable vaut null tant que NetInfo n'a pas encore vérifié :
    // on ne déclare « hors ligne » que sur un « false » certain (pas de bandeau qui clignote au démarrage).
    rappel(etat.isConnected !== false && etat.isInternetReachable !== false);
  });
}