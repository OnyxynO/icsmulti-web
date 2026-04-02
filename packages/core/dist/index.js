// Types principaux du générateur ICS
// ─── Utilitaires bas niveau ───────────────────────────────────────────────────
/** CRLF RFC 5545 */
const CRLF = "\r\n";
/**
 * Échappe les caractères spéciaux dans les valeurs textuelles RFC 5545.
 * Ordre important : backslash d'abord pour éviter le double-échappement.
 */
function echapper(valeur) {
    return valeur
        .replace(/\\/g, "\\\\") // \ → \\
        .replace(/;/g, "\\;") // ; → \;
        .replace(/,/g, "\\,") // , → \,
        .replace(/\r/g, "") // \r supprimé AVANT \n pour éviter que \r\n génère un CRLF parasite
        .replace(/\n/g, "\\n"); // newline → \n (littéral)
}
/**
 * Line folding RFC 5545 §3.1 : replie les lignes dépassant 75 octets.
 * La continuation s'écrit CRLF + espace (1 octet d'indentation).
 * On travaille en octets UTF-8, pas en caractères.
 */
function replierLigne(ligne) {
    const encoder = new TextEncoder();
    const octets = encoder.encode(ligne);
    if (octets.length <= 75) {
        return ligne + CRLF;
    }
    const segments = [];
    let debut = 0;
    while (debut < octets.length) {
        // Premier segment : 75 octets ; suivants : 74 (1 octet pour l'espace de continuation)
        const limite = debut === 0 ? 75 : 74;
        let fin = Math.min(debut + limite, octets.length);
        // Reculer si on coupe au milieu d'un caractère multi-octets UTF-8
        // Les octets de continuation UTF-8 commencent par 10xxxxxx (0x80–0xBF)
        while (fin > debut && fin < octets.length && (octets[fin] & 0xc0) === 0x80) {
            fin--;
        }
        const segment = new TextDecoder().decode(octets.slice(debut, fin));
        segments.push(debut === 0 ? segment : " " + segment);
        debut = fin;
    }
    return segments.join(CRLF) + CRLF;
}
/**
 * Formate une propriété ICS et applique le line folding.
 * Exemple : propriete("SUMMARY", "Mon titre") → "SUMMARY:Mon titre\r\n"
 */
function propriete(nom, valeur) {
    return replierLigne(`${nom}:${valeur}`);
}
// ─── Formatage des dates ──────────────────────────────────────────────────────
/**
 * Formate une date en YYYYMMDD pour les événements journée entière (VALUE=DATE).
 * On utilise getUTC* : la valeur ISO "2024-06-20" est minuit UTC,
 * les méthodes locales pourraient retourner le jour précédent en UTC-.
 */
function formaterDate(date) {
    const annee = date.getUTCFullYear().toString().padStart(4, "0");
    const mois = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const jour = date.getUTCDate().toString().padStart(2, "0");
    return `${annee}${mois}${jour}`;
}
/**
 * Formate une date en YYYYMMDDTHHMMSS pour les événements horodatés.
 * RFC 5545 §3.3.5 : quand TZID est présent, les composantes représentent
 * l'heure LOCALE dans ce fuseau. On utilise Intl.DateTimeFormat pour
 * extraire les composantes dans le bon fuseau, sans dépendance externe.
 */
function formaterDateHeure(date, fuseau) {
    // Intl.DateTimeFormat retourne les composantes dans le fuseau cible
    const parties = new Intl.DateTimeFormat("fr-FR", {
        timeZone: fuseau,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(date);
    // On récupère chaque composante par type
    const get = (type) => parties.find((p) => p.type === type)?.value ?? "00";
    const annee = get("year");
    const mois = get("month");
    const jour = get("day");
    // hour12: false peut retourner "24" à minuit sur certains moteurs — on normalise
    const heure = get("hour").replace(/^24$/, "00").padStart(2, "0");
    const minute = get("minute");
    const seconde = get("second");
    return `${annee}${mois}${jour}T${heure}${minute}${seconde}`;
}
/**
 * Formate le DTSTAMP en UTC (format YYYYMMDDTHHMMSSZ).
 * DTSTAMP est toujours en UTC, on utilise getUTC* directement.
 */
function formaterDtstamp(date) {
    const annee = date.getUTCFullYear().toString().padStart(4, "0");
    const mois = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const jour = date.getUTCDate().toString().padStart(2, "0");
    const heure = date.getUTCHours().toString().padStart(2, "0");
    const minute = date.getUTCMinutes().toString().padStart(2, "0");
    const seconde = date.getUTCSeconds().toString().padStart(2, "0");
    return `${annee}${mois}${jour}T${heure}${minute}${seconde}Z`;
}
// ─── Génération des blocs ICS ─────────────────────────────────────────────────
/**
 * Génère le bloc VALARM pour un rappel en minutes avant l'événement.
 */
function genererValarm(rappelMinutes) {
    let bloc = "";
    bloc += `BEGIN:VALARM${CRLF}`;
    bloc += propriete("TRIGGER", `-PT${rappelMinutes}M`);
    bloc += propriete("ACTION", "DISPLAY");
    bloc += propriete("DESCRIPTION", "Rappel");
    bloc += `END:VALARM${CRLF}`;
    return bloc;
}
/**
 * Génère un bloc VEVENT complet pour une occurrence donnée.
 */
function genererVevent(occurrence, evenement, fuseau, maintenant) {
    let bloc = "";
    bloc += `BEGIN:VEVENT${CRLF}`;
    // UID unique : crypto.randomUUID() garantit l'unicité même si deux occurrences
    // ont le même id ou sont générées dans le même milliseconde
    const uid = `${crypto.randomUUID()}@icsmulti`;
    bloc += propriete("UID", uid);
    // DTSTAMP : date/heure de génération en UTC
    bloc += propriete("DTSTAMP", formaterDtstamp(maintenant));
    if (occurrence.touteLaJournee) {
        // Événement journée entière : VALUE=DATE, fin = J+1
        const finJournee = new Date(occurrence.dateFin);
        finJournee.setUTCDate(finJournee.getUTCDate() + 1);
        bloc += propriete("DTSTART;VALUE=DATE", formaterDate(occurrence.dateDebut));
        bloc += propriete("DTEND;VALUE=DATE", formaterDate(finJournee));
    }
    else {
        // Événement horodaté avec TZID explicite
        bloc += propriete(`DTSTART;TZID=${fuseau}`, formaterDateHeure(occurrence.dateDebut, fuseau));
        bloc += propriete(`DTEND;TZID=${fuseau}`, formaterDateHeure(occurrence.dateFin, fuseau));
    }
    // Titre et notes — échappement obligatoire
    bloc += propriete("SUMMARY", echapper(evenement.titre));
    if (evenement.notes.length > 0) {
        bloc += propriete("DESCRIPTION", echapper(evenement.notes));
    }
    // Lieu — omis si vide
    if (occurrence.lieu.length > 0) {
        bloc += propriete("LOCATION", echapper(occurrence.lieu));
    }
    // Rappel
    if (occurrence.rappelMinutes !== undefined) {
        bloc += genererValarm(occurrence.rappelMinutes);
    }
    bloc += `END:VEVENT${CRLF}`;
    return bloc;
}
// ─── Point d'entrée public ────────────────────────────────────────────────────
/**
 * Génère un fichier .ics (RFC 5545) à partir d'un événement multi-occurrences.
 *
 * @param evenement - L'événement avec ses occurrences
 * @param options   - Options d'export (fuseau horaire, etc.)
 * @returns Le contenu du fichier ICS en UTF-8 avec CRLF
 */
export function genererICS(evenement, options) {
    const fuseau = options?.fuseau ?? "Europe/Paris";
    // Validation du fuseau IANA : un identifiant invalide (ex: "UTC+2", "Paris")
    // provoquerait un RangeError silencieux plus loin dans formaterDateHeure.
    try {
        new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau });
    }
    catch {
        throw new Error(`Fuseau horaire invalide : "${fuseau}". Utiliser un identifiant IANA comme "Europe/Paris".`);
    }
    // On fixe un instant de génération commun à toutes les occurrences
    // pour que DTSTAMP soit cohérent dans le même export.
    // Les UID sont uniques grâce à crypto.randomUUID().
    const maintenant = new Date();
    let contenu = "";
    contenu += `BEGIN:VCALENDAR${CRLF}`;
    contenu += propriete("VERSION", "2.0");
    contenu += propriete("PRODID", "-//ICSMulti//ICSMulti Web//FR");
    contenu += propriete("CALSCALE", "GREGORIAN");
    contenu += propriete("METHOD", "PUBLISH");
    for (const occurrence of evenement.occurrences) {
        contenu += genererVevent(occurrence, evenement, fuseau, maintenant);
    }
    contenu += `END:VCALENDAR${CRLF}`;
    return contenu;
}
//# sourceMappingURL=index.js.map