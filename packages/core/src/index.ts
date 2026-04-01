// Types principaux du générateur ICS

export interface Occurrence {
  id: string;
  dateDebut: Date;
  dateFin: Date;
  lieu: string;
  touteLaJournee: boolean;
  rappelMinutes?: number; // undefined = pas de rappel
}

export interface Evenement {
  titre: string;
  notes: string;
  occurrences: Occurrence[];
}

export interface OptionsExport {
  fuseau?: string; // défaut : "Europe/Paris"
}

/**
 * Génère un fichier .ics (RFC 5545) à partir d'un événement multi-occurrences.
 * Stub — implémentation complète à venir dans la phase 2.
 */
export function genererICS(_evenement: Evenement, _options?: OptionsExport): string {
  return "";
}
