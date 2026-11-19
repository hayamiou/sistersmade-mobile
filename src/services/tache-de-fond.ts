/**
 * src/services/tache-de-fond.ts
 *
 * Tâche en arrière-plan (SM-23, obligation de la grille) : iOS réveille l'appli
 * de temps en temps, même fermée, et on en profite pour rafraîchir le cache
 * hors-ligne (SM-21). Ainsi, en ouvrant l'appli sans réseau, on voit des
 * demandes récentes, pas celles de la veille.
 *
 * ⚠️ Ne fonctionne PAS dans Expo Go : seulement dans le build (preview),
 *    qui contient le module natif et l'autorisation iOS (plugin dans app.json).
 *
 * Deux règles imposées par expo-task-manager :
 *  1. defineTask doit être appelé au CHARGEMENT du fichier (portée globale),
 *     pas dans un composant : quand iOS réveille l'appli en arrière-plan,
 *     aucun écran n'est monté, mais ce fichier est exécuté.
 *  2. Ce fichier doit donc être importé au démarrage (dans _layout.tsx).
 */
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import { ecouterSession } from "@/services/auth";
import { enregistrerDemandes } from "@/services/cache-demandes";
import { chargerDemandes } from "@/services/demandes";

const NOM_TACHE = "sistersmade-rafraichir-demandes";

/** iOS décide du moment exact ; on demande « au mieux toutes les 30 minutes ». */
const INTERVALLE_MINUTES = 30;

/**
 * Attend que Firebase ait relu la session persistée (au réveil, elle n'est pas
 * encore chargée). Renvoie true si une utilisatrice est connectée.
 * Indispensable : les règles Firestore refusent la lecture sans session.
 */
function attendreSession(): Promise<boolean> {
  return new Promise((resoudre) => {
    let fini = false;
    let arreter: (() => void) | null = null;
    arreter = ecouterSession((session) => {
      if (fini) return;
      fini = true;
      resoudre(session !== null);
      arreter?.(); // une seule réponse nous suffit : on se désabonne
    });
    if (fini) arreter(); // cas où le rappel aurait été appelé avant l'affectation
  });
}

// 1. Définition de la tâche, à la portée globale du fichier.
TaskManager.defineTask(NOM_TACHE, async () => {
  try {
    const connectee = await attendreSession();
    if (!connectee) return BackgroundTask.BackgroundTaskResult.Success; // rien à faire

    const demandes = await chargerDemandes();
    await enregistrerDemandes(demandes);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    // Pas de réseau au réveil, par exemple : on réessaiera au prochain.
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * 2. Demande à iOS de planifier la tâche. Appelée une fois au démarrage.
 * « Best effort » : dans Expo Go (module absent) ou si l'utilisatrice a désactivé
 * l'actualisation en arrière-plan, on ignore l'échec — l'appli marche sans.
 */
export async function activerTacheDeFond(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(NOM_TACHE, { minimumInterval: INTERVALLE_MINUTES });
  } catch {
    // Volontairement silencieux : la tâche de fond est un confort.
  }
}