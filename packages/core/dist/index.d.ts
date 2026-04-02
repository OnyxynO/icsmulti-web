export interface Occurrence {
    id: string;
    dateDebut: Date;
    dateFin: Date;
    lieu: string;
    touteLaJournee: boolean;
    rappelMinutes?: number;
}
export interface Evenement {
    titre: string;
    notes: string;
    occurrences: Occurrence[];
}
export interface OptionsExport {
    fuseau?: string;
}
/**
 * Génère un fichier .ics (RFC 5545) à partir d'un événement multi-occurrences.
 *
 * @param evenement - L'événement avec ses occurrences
 * @param options   - Options d'export (fuseau horaire, etc.)
 * @returns Le contenu du fichier ICS en UTF-8 avec CRLF
 */
export declare function genererICS(evenement: Evenement, options?: OptionsExport): string;
//# sourceMappingURL=index.d.ts.map