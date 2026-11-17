/**
 * src/app/(onglets)/_layout.tsx
 *
 * Groupe « (onglets) » : la partie de l'appli réservée aux utilisatrices
 * connectées (la garde arrive avec SM-12). Les parenthèses font que ce
 * dossier n'apparaît pas dans l'URL : (onglets)/index.tsx répond à « / ».
 */
import AppTabs from "@/components/app-tabs";

export default function OngletsLayout() {
  return <AppTabs />;
}
