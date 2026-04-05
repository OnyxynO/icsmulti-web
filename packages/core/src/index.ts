// Types principaux du générateur ICS

export interface Occurrence {
  id: string;
  titre: string;
  notes: string;
  dateDebut: Date;
  dateFin: Date;
  lieu: string;
  touteLaJournee: boolean;
  rappelMinutes?: number; // undefined = pas de rappel
}

export interface Evenement {
  occurrences: Occurrence[];
}

export interface OptionsExport {
  fuseau?: string; // défaut : "Europe/Paris"
}

// ─── Utilitaires bas niveau ───────────────────────────────────────────────────

/** CRLF RFC 5545 */
const CRLF = "\r\n";

/**
 * Échappe les caractères spéciaux dans les valeurs textuelles RFC 5545.
 * Ordre important : backslash d'abord pour éviter le double-échappement.
 */
function echapper(valeur: string): string {
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
function replierLigne(ligne: string): string {
  const encoder = new TextEncoder();
  const octets = encoder.encode(ligne);

  if (octets.length <= 75) {
    return ligne + CRLF;
  }

  const segments: string[] = [];
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
    segments.push(debut === 0 ? segment : ` ${segment}`);
    debut = fin;
  }

  return segments.join(CRLF) + CRLF;
}

/**
 * Formate une propriété ICS et applique le line folding.
 * Exemple : propriete("SUMMARY", "Mon titre") → "SUMMARY:Mon titre\r\n"
 */
function propriete(nom: string, valeur: string): string {
  return replierLigne(`${nom}:${valeur}`);
}

// ─── Formatage des dates ──────────────────────────────────────────────────────

/**
 * Formate une date en YYYYMMDD pour les événements journée entière (VALUE=DATE).
 * On utilise getUTC* : la valeur ISO "2024-06-20" est minuit UTC,
 * les méthodes locales pourraient retourner le jour précédent en UTC-.
 */
function formaterDate(date: Date): string {
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
function formaterDateHeure(date: Date, fuseau: string): string {
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
  const get = (type: string) => parties.find((p) => p.type === type)?.value ?? "00";

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
function formaterDtstamp(date: Date): string {
  const annee = date.getUTCFullYear().toString().padStart(4, "0");
  const mois = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const jour = date.getUTCDate().toString().padStart(2, "0");
  const heure = date.getUTCHours().toString().padStart(2, "0");
  const minute = date.getUTCMinutes().toString().padStart(2, "0");
  const seconde = date.getUTCSeconds().toString().padStart(2, "0");
  return `${annee}${mois}${jour}T${heure}${minute}${seconde}Z`;
}

// ─── Génération VTIMEZONE ────────────────────────────────────────────────────

/**
 * Calcule l'offset UTC en minutes pour une date dans un fuseau horaire.
 * Positif = à l'est de UTC (ex: Europe/Paris UTC+2 → 120).
 */
function calcOffset(date: Date, fuseau: string): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const p = fmt.formatToParts(date);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  const localUTC = Date.UTC(
    +get("year"),
    +get("month") - 1,
    +get("day"),
    +get("hour").replace(/^24$/, "00"),
    +get("minute"),
    +get("second"),
  );
  return Math.round((localUTC - date.getTime()) / 60_000);
}

/**
 * Formate un offset en minutes en chaîne ±HHMM (ex : +0200, -0500).
 */
function formaterTzOffset(minutes: number): string {
  const signe = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  return `${signe}${Math.floor(abs / 60)
    .toString()
    .padStart(2, "0")}${(abs % 60).toString().padStart(2, "0")}`;
}

/**
 * Trouve par dichotomie le premier instant où l'offset change dans [tsDebut, tsFin].
 * Précision : 1 minute.
 */
function trouverTransitionDST(fuseau: string, tsDebut: number, tsFin: number): Date {
  let a = tsDebut;
  let b = tsFin;
  const offA = calcOffset(new Date(a), fuseau);
  while (b - a > 60_000) {
    const mid = Math.floor((a + b) / 2);
    if (calcOffset(new Date(mid), fuseau) === offA) a = mid;
    else b = mid;
  }
  return new Date(b);
}

/**
 * Génère le bloc VTIMEZONE RFC 5545 §3.6.5 pour un fuseau IANA.
 * Utilise l'API Intl pour calculer les transitions dynamiquement — aucune dépendance.
 *
 * - Fuseau sans DST (UTC, Asia/Tokyo…) → STANDARD uniquement
 * - Fuseau avec DST → STANDARD + DAYLIGHT, avec RDATE pour chaque année des occurrences
 */
function genererVTimezone(fuseau: string, annees: number[]): string {
  const anneeRef = annees[0];
  const offJan = calcOffset(new Date(Date.UTC(anneeRef, 0, 15)), fuseau);
  const offJul = calcOffset(new Date(Date.UTC(anneeRef, 6, 15)), fuseau);
  const aDst = offJan !== offJul;

  let bloc = `BEGIN:VTIMEZONE${CRLF}`;
  bloc += propriete("TZID", fuseau);

  if (!aDst) {
    // Fuseau sans DST — STANDARD uniquement
    bloc += `BEGIN:STANDARD${CRLF}`;
    bloc += propriete("DTSTART", "19700101T000000");
    bloc += propriete("TZOFFSETFROM", formaterTzOffset(offJan));
    bloc += propriete("TZOFFSETTO", formaterTzOffset(offJan));
    bloc += `END:STANDARD${CRLF}`;
  } else {
    // L'offset le moins élevé = heure standard (hiver dans l'hémisphère nord)
    const offStd = Math.min(offJan, offJul);
    const offDst = Math.max(offJan, offJul);

    const rdStd: string[] = [];
    const rdDst: string[] = [];

    for (const annee of annees) {
      for (let mois = 0; mois < 12; mois++) {
        const tsDebut = Date.UTC(annee, mois, 1);
        const tsFin = Date.UTC(annee, mois + 1, 1) - 1;

        // Pas de transition ce mois-ci
        if (calcOffset(new Date(tsDebut), fuseau) === calcOffset(new Date(tsFin), fuseau)) continue;

        const transition = trouverTransitionDST(fuseau, tsDebut, tsFin);
        // Heure locale après la transition (dans le nouveau fuseau)
        const dtLocal = formaterDateHeure(transition, fuseau);
        const offApres = calcOffset(new Date(transition.getTime() + 60_000), fuseau);

        if (offApres === offStd) rdStd.push(dtLocal);
        else rdDst.push(dtLocal);
      }
    }

    // ── STANDARD (heure d'hiver) ──
    bloc += `BEGIN:STANDARD${CRLF}`;
    bloc += propriete("DTSTART", rdStd[0] ?? "19701025T030000");
    if (rdStd.length > 1) bloc += propriete("RDATE", rdStd.slice(1).join(","));
    bloc += propriete("TZOFFSETFROM", formaterTzOffset(offDst));
    bloc += propriete("TZOFFSETTO", formaterTzOffset(offStd));
    bloc += `END:STANDARD${CRLF}`;

    // ── DAYLIGHT (heure d'été) ──
    bloc += `BEGIN:DAYLIGHT${CRLF}`;
    bloc += propriete("DTSTART", rdDst[0] ?? "19700329T020000");
    if (rdDst.length > 1) bloc += propriete("RDATE", rdDst.slice(1).join(","));
    bloc += propriete("TZOFFSETFROM", formaterTzOffset(offStd));
    bloc += propriete("TZOFFSETTO", formaterTzOffset(offDst));
    bloc += `END:DAYLIGHT${CRLF}`;
  }

  bloc += `END:VTIMEZONE${CRLF}`;
  return bloc;
}

// ─── Génération des blocs ICS ─────────────────────────────────────────────────

/**
 * Génère le bloc VALARM pour un rappel en minutes avant l'événement.
 */
function genererValarm(rappelMinutes: number): string {
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
function genererVevent(occurrence: Occurrence, fuseau: string, maintenant: Date): string {
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
  } else {
    // Événement horodaté avec TZID explicite
    bloc += propriete(`DTSTART;TZID=${fuseau}`, formaterDateHeure(occurrence.dateDebut, fuseau));
    bloc += propriete(`DTEND;TZID=${fuseau}`, formaterDateHeure(occurrence.dateFin, fuseau));
  }

  // Titre et notes propres à chaque occurrence — échappement obligatoire
  bloc += propriete("SUMMARY", echapper(occurrence.titre));
  if (occurrence.notes.length > 0) {
    bloc += propriete("DESCRIPTION", echapper(occurrence.notes));
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
export function genererICS(evenement: Evenement, options?: OptionsExport): string {
  const fuseau = options?.fuseau ?? "Europe/Paris";

  // Validation du fuseau IANA : un identifiant invalide (ex: "UTC+2", "Paris")
  // provoquerait un RangeError silencieux plus loin dans formaterDateHeure.
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau });
  } catch {
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

  // VTIMEZONE requis par RFC 5545 §3.6.5 quand des occurrences horodatées utilisent TZID
  const occHorodatees = evenement.occurrences.filter((o) => !o.touteLaJournee);
  if (occHorodatees.length > 0) {
    const annees = [
      ...new Set(occHorodatees.flatMap((o) => [o.dateDebut.getUTCFullYear(), o.dateFin.getUTCFullYear()])),
    ].sort((a, b) => a - b);
    contenu += genererVTimezone(fuseau, annees);
  }

  for (const occurrence of evenement.occurrences) {
    contenu += genererVevent(occurrence, fuseau, maintenant);
  }

  contenu += `END:VCALENDAR${CRLF}`;
  return contenu;
}
