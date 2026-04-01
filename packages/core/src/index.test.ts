import { describe, expect, it } from "vitest";
import { genererICS, type Evenement, type Occurrence } from "./index.js";

// ─── Données de test réutilisables ────────────────────────────────────────────

const occurrenceSimple: Occurrence = {
  id: "occ-1",
  dateDebut: new Date("2024-06-15T10:00:00Z"),
  dateFin: new Date("2024-06-15T11:00:00Z"),
  lieu: "Paris",
  touteLaJournee: false,
};

const evenementSimple: Evenement = {
  titre: "Réunion d'équipe",
  notes: "Ordre du jour à définir",
  occurrences: [occurrenceSimple],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrait les lignes logiques après dépliage du line folding. */
function depilerLignes(ics: string): string[] {
  // Déplie : CRLF + espace/tabulation = continuation
  const deplie = ics.replace(/\r\n[ \t]/g, "");
  return deplie.split("\r\n").filter((l) => l.length > 0);
}

/** Retourne true si toutes les lignes du contenu ICS se terminent par CRLF. */
function toutesLesLignesTerminentParCRLF(ics: string): boolean {
  // On découpe sur LF et on vérifie que chaque ligne se termine par CR
  // (sauf la dernière si elle est vide)
  const lignes = ics.split("\n");
  // La dernière entrée après le dernier \n est vide — on l'ignore
  const lignesSansVide = lignes.slice(0, -1);
  return lignesSansVide.every((l) => l.endsWith("\r"));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("genererICS", () => {
  // ── Structure VCALENDAR / VEVENT ──────────────────────────────────────────

  it("génère un événement simple : structure VCALENDAR et VEVENT présents", () => {
    const resultat = genererICS(evenementSimple);

    expect(resultat).toContain("BEGIN:VCALENDAR");
    expect(resultat).toContain("END:VCALENDAR");
    expect(resultat).toContain("BEGIN:VEVENT");
    expect(resultat).toContain("END:VEVENT");
    expect(resultat).toContain("VERSION:2.0");
    expect(resultat).toContain("PRODID:");
  });

  it("génère autant de VEVENT que d'occurrences", () => {
    const evenement: Evenement = {
      titre: "Multi",
      notes: "",
      occurrences: [
        { ...occurrenceSimple, id: "occ-a" },
        { ...occurrenceSimple, id: "occ-b" },
        { ...occurrenceSimple, id: "occ-c" },
      ],
    };
    const resultat = genererICS(evenement);
    const nb = (resultat.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(nb).toBe(3);
  });

  it("retourne une chaîne vide de VEVENT si aucune occurrence", () => {
    const resultat = genererICS({ titre: "Vide", notes: "", occurrences: [] });
    expect(resultat).toContain("BEGIN:VCALENDAR");
    expect(resultat).not.toContain("BEGIN:VEVENT");
  });

  // ── CRLF ──────────────────────────────────────────────────────────────────

  it("toutes les lignes se terminent par CRLF (\\r\\n)", () => {
    const resultat = genererICS(evenementSimple);
    expect(toutesLesLignesTerminentParCRLF(resultat)).toBe(true);
  });

  it("ne contient pas de LF solitaire (sans CR précédent)", () => {
    const resultat = genererICS(evenementSimple);
    // Remplace tous les CRLF puis vérifie qu'il ne reste aucun \n
    const sansCRLF = resultat.replace(/\r\n/g, "");
    expect(sansCRLF).not.toContain("\n");
  });

  // ── Line folding ──────────────────────────────────────────────────────────

  it("replie les lignes dépassant 75 octets", () => {
    const titreLong = "A".repeat(80); // SUMMARY: + 80 chars > 75 octets
    const evenement: Evenement = {
      titre: titreLong,
      notes: "",
      occurrences: [occurrenceSimple],
    };
    const resultat = genererICS(evenement);

    // Aucune ligne (avant dépliage) ne doit dépasser 75 octets
    const lignes = resultat.split("\r\n").filter((l) => l.length > 0);
    const encoder = new TextEncoder();
    const lignesTropLongues = lignes.filter(
      (l) => encoder.encode(l).length > 75,
    );
    expect(lignesTropLongues).toHaveLength(0);
  });

  it("ligne repliée : continuation commence par un espace", () => {
    const titreLong = "B".repeat(80);
    const evenement: Evenement = {
      titre: titreLong,
      notes: "",
      occurrences: [occurrenceSimple],
    };
    const resultat = genererICS(evenement);

    // Cherche une ligne de continuation (après CRLF, commence par espace)
    expect(resultat).toMatch(/\r\n /);
  });

  it("ligne pliée puis dépliée reconstruit le titre complet", () => {
    const titreLong = "C".repeat(100);
    const evenement: Evenement = {
      titre: titreLong,
      notes: "",
      occurrences: [occurrenceSimple],
    };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);
    const ligneSummary = lignes.find((l) => l.startsWith("SUMMARY:"));
    expect(ligneSummary).toBeDefined();
    expect(ligneSummary).toBe(`SUMMARY:${"C".repeat(100)}`);
  });

  // ── Échappement ───────────────────────────────────────────────────────────

  it("échappe les virgules dans le titre", () => {
    const evenement: Evenement = {
      ...evenementSimple,
      titre: "Café, thé, jus",
    };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);
    const summary = lignes.find((l) => l.startsWith("SUMMARY:"));
    expect(summary).toBe("SUMMARY:Café\\, thé\\, jus");
  });

  it("échappe les points-virgules dans le titre", () => {
    const evenement: Evenement = {
      ...evenementSimple,
      titre: "Point A; Point B",
    };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);
    const summary = lignes.find((l) => l.startsWith("SUMMARY:"));
    expect(summary).toBe("SUMMARY:Point A\\; Point B");
  });

  it("échappe les backslashs dans le titre", () => {
    const evenement: Evenement = {
      ...evenementSimple,
      titre: "Chemin\\Fichier",
    };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);
    const summary = lignes.find((l) => l.startsWith("SUMMARY:"));
    expect(summary).toBe("SUMMARY:Chemin\\\\Fichier");
  });

  it("échappe les newlines dans les notes", () => {
    const evenement: Evenement = {
      ...evenementSimple,
      notes: "Ligne 1\nLigne 2",
    };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);
    const desc = lignes.find((l) => l.startsWith("DESCRIPTION:"));
    expect(desc).toBe("DESCRIPTION:Ligne 1\\nLigne 2");
  });

  // ── Journée entière ───────────────────────────────────────────────────────

  it("journée entière : DTSTART avec VALUE=DATE au format YYYYMMDD", () => {
    const occ: Occurrence = {
      id: "occ-jour",
      dateDebut: new Date("2024-06-20"),
      dateFin: new Date("2024-06-20"),
      lieu: "",
      touteLaJournee: true,
    };
    const evenement: Evenement = { titre: "Fête", notes: "", occurrences: [occ] };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);

    const dtstart = lignes.find((l) => l.startsWith("DTSTART;VALUE=DATE:"));
    expect(dtstart).toBeDefined();
    // Valeur = YYYYMMDD (8 chiffres)
    expect(dtstart).toMatch(/^DTSTART;VALUE=DATE:\d{8}$/);
  });

  it("journée entière : DTEND = J+1", () => {
    const occ: Occurrence = {
      id: "occ-jour",
      dateDebut: new Date("2024-06-20"),
      dateFin: new Date("2024-06-20"),
      lieu: "",
      touteLaJournee: true,
    };
    const evenement: Evenement = { titre: "Fête", notes: "", occurrences: [occ] };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);

    const dtend = lignes.find((l) => l.startsWith("DTEND;VALUE=DATE:"));
    expect(dtend).toBeDefined();
    // dateFin = 2024-06-20 → DTEND = 20240621
    expect(dtend).toBe("DTEND;VALUE=DATE:20240621");
  });

  it("journée entière : pas de TZID dans DTSTART/DTEND", () => {
    const occ: Occurrence = {
      id: "occ-jour",
      dateDebut: new Date("2024-06-20"),
      dateFin: new Date("2024-06-20"),
      lieu: "",
      touteLaJournee: true,
    };
    const evenement: Evenement = { titre: "Fête", notes: "", occurrences: [occ] };
    const resultat = genererICS(evenement);

    expect(resultat).not.toMatch(/DTSTART;TZID=/);
    expect(resultat).not.toMatch(/DTEND;TZID=/);
  });

  // ── Rappel VALARM ─────────────────────────────────────────────────────────

  it("rappel : bloc VALARM présent avec TRIGGER correct", () => {
    const occ: Occurrence = {
      ...occurrenceSimple,
      rappelMinutes: 15,
    };
    const evenement: Evenement = {
      ...evenementSimple,
      occurrences: [occ],
    };
    const resultat = genererICS(evenement);

    expect(resultat).toContain("BEGIN:VALARM");
    expect(resultat).toContain("END:VALARM");
    expect(resultat).toContain("TRIGGER:-PT15M");
    expect(resultat).toContain("ACTION:DISPLAY");
  });

  it("sans rappel : aucun bloc VALARM", () => {
    const occ: Occurrence = {
      ...occurrenceSimple,
      rappelMinutes: undefined,
    };
    const evenement: Evenement = {
      ...evenementSimple,
      occurrences: [occ],
    };
    const resultat = genererICS(evenement);

    expect(resultat).not.toContain("BEGIN:VALARM");
  });

  it("rappel de 0 minute : TRIGGER:-PT0M", () => {
    const occ: Occurrence = { ...occurrenceSimple, rappelMinutes: 0 };
    const resultat = genererICS({ ...evenementSimple, occurrences: [occ] });
    expect(resultat).toContain("TRIGGER:-PT0M");
  });

  // ── Lieu ──────────────────────────────────────────────────────────────────

  it("lieu non vide : propriété LOCATION présente", () => {
    const occ: Occurrence = { ...occurrenceSimple, lieu: "Salle Voltaire" };
    const resultat = genererICS({ ...evenementSimple, occurrences: [occ] });
    const lignes = depilerLignes(resultat);
    const location = lignes.find((l) => l.startsWith("LOCATION:"));
    expect(location).toBe("LOCATION:Salle Voltaire");
  });

  it("lieu vide : propriété LOCATION absente", () => {
    const occ: Occurrence = { ...occurrenceSimple, lieu: "" };
    const resultat = genererICS({ ...evenementSimple, occurrences: [occ] });
    expect(resultat).not.toContain("LOCATION:");
  });

  // ── Titre vide ────────────────────────────────────────────────────────────

  it("titre vide : SUMMARY vide mais VEVENT généré quand même", () => {
    const evenement: Evenement = {
      titre: "",
      notes: "",
      occurrences: [occurrenceSimple],
    };
    const resultat = genererICS(evenement);
    expect(resultat).toContain("BEGIN:VEVENT");
    // SUMMARY: présent mais avec valeur vide
    expect(resultat).toContain("SUMMARY:");
  });

  // ── UID unique ────────────────────────────────────────────────────────────

  it("deux occurrences différentes ont des UID distincts", () => {
    const evenement: Evenement = {
      titre: "Test UID",
      notes: "",
      occurrences: [
        { ...occurrenceSimple, id: "occ-x" },
        { ...occurrenceSimple, id: "occ-y" },
      ],
    };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);
    const uids = lignes
      .filter((l) => l.startsWith("UID:"))
      .map((l) => l.slice(4));

    expect(uids).toHaveLength(2);
    expect(uids[0]).not.toBe(uids[1]);
  });

  // ── Validation du fuseau ──────────────────────────────────────────────────

  it("fuseau invalide : lancer une Error avec message explicite", () => {
    expect(() =>
      genererICS(evenementSimple, { fuseau: "UTC+2" }),
    ).toThrow('Fuseau horaire invalide : "UTC+2". Utiliser un identifiant IANA comme "Europe/Paris".');
  });

  // ── Échappement de \r ──────────────────────────────────────────────────────

  it("échappe une chaîne avec \\r\\n : \\r supprimé, \\n converti en littéral ICS", () => {
    const evenement: Evenement = {
      ...evenementSimple,
      notes: "Ligne 1\r\nLigne 2",
    };
    const resultat = genererICS(evenement);
    const lignes = depilerLignes(resultat);
    const desc = lignes.find((l) => l.startsWith("DESCRIPTION:"));
    // \r doit être absent, \n doit être converti en \n littéral ICS
    expect(desc).toBe("DESCRIPTION:Ligne 1\\nLigne 2");
    expect(desc).not.toContain("\r");
  });

  // ── Fuseau horaire ────────────────────────────────────────────────────────

  it("fuseau par défaut (Europe/Paris) dans DTSTART des événements horodatés", () => {
    const resultat = genererICS(evenementSimple);
    expect(resultat).toContain("DTSTART;TZID=Europe/Paris:");
  });

  it("fuseau personnalisé pris en compte dans DTSTART", () => {
    const resultat = genererICS(evenementSimple, { fuseau: "America/New_York" });
    expect(resultat).toContain("DTSTART;TZID=America/New_York:");
    expect(resultat).toContain("DTEND;TZID=America/New_York:");
  });

  it("fuseau présent dans DTEND pour événement horodaté", () => {
    const resultat = genererICS(evenementSimple);
    expect(resultat).toContain("DTEND;TZID=Europe/Paris:");
  });

  it("heure locale correcte dans DTSTART : 10h UTC = 12h en Europe/Paris (UTC+2 en été)", () => {
    // 2024-06-15T10:00:00Z → UTC+2 en été → heure locale = 12h
    const occ: Occurrence = {
      id: "occ-tz",
      dateDebut: new Date("2024-06-15T10:00:00Z"),
      dateFin: new Date("2024-06-15T11:00:00Z"),
      lieu: "",
      touteLaJournee: false,
    };
    const evenement: Evenement = { titre: "Test fuseau", notes: "", occurrences: [occ] };
    const resultat = genererICS(evenement, { fuseau: "Europe/Paris" });
    const lignes = depilerLignes(resultat);

    const dtstart = lignes.find((l) => l.startsWith("DTSTART;TZID=Europe/Paris:"));
    expect(dtstart).toBeDefined();
    // L'heure locale doit être T120000 (12h), pas T100000 (10h UTC)
    expect(dtstart).toContain("T120000");
  });

  // ── DTSTAMP ───────────────────────────────────────────────────────────────

  it("DTSTAMP présent et au format UTC (se termine par Z)", () => {
    const resultat = genererICS(evenementSimple);
    const lignes = depilerLignes(resultat);
    const dtstamp = lignes.find((l) => l.startsWith("DTSTAMP:"));
    expect(dtstamp).toBeDefined();
    // Format attendu : DTSTAMP:YYYYMMDDTHHMMSSz
    expect(dtstamp).toMatch(/^DTSTAMP:\d{8}T\d{6}Z$/);
  });
});
