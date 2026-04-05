// Tests de la route POST /api/generate
// Stratégie : appel direct de la fonction POST avec un NextRequest construit manuellement.
// Les dépendances externes (redis, genererICS) sont mockées.

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock de @/lib/kv : redis et hashCle injectés depuis le test
const mockHgetall = vi.fn();
const mockHincrby = vi.fn();
const mockHashCle = vi.fn();

vi.mock("@/lib/kv", () => ({
  get redis() {
    return mockRedis;
  },
  hashCle: (...args: unknown[]) => mockHashCle(...args),
}));

// Mock de @icsmulti/core
const mockGenererICS = vi.fn();
vi.mock("@icsmulti/core", () => ({
  genererICS: (...args: unknown[]) => mockGenererICS(...args),
}));

// redis peut être null (503) ou un objet avec hgetall/hincrby
let mockRedis: { hgetall: typeof mockHgetall; hincrby: typeof mockHincrby } | null;

// ─── Données de test ──────────────────────────────────────────────────────────

const evenementValide = {
  occurrences: [
    {
      id: "occ-1",
      titre: "Réunion d'équipe",
      notes: "Ordre du jour",
      dateDebut: "2024-06-15T10:00:00Z",
      dateFin: "2024-06-15T11:00:00Z",
      lieu: "Paris",
      touteLaJournee: false,
    },
  ],
};

/** Construit une NextRequest POST vers /api/generate */
function creerRequete(corps: unknown, cleAPI?: string): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cleAPI !== undefined) {
    headers["X-API-Key"] = cleAPI;
  }
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    headers,
    body: JSON.stringify(corps),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Par défaut : redis configuré, clé valide, genererICS fonctionnel
    mockRedis = { hgetall: mockHgetall, hincrby: mockHincrby };
    mockHashCle.mockResolvedValue("fakehash");
    mockHgetall.mockResolvedValue({ createdAt: "2024-01-01", label: "test", usageCount: 0 });
    mockHincrby.mockResolvedValue(1);
    mockGenererICS.mockReturnValue("BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n");
  });

  // ── 503 — service non configuré ───────────────────────────────────────────

  it("retourne 503 si redis est null (Upstash non configuré)", async () => {
    mockRedis = null;
    const { POST } = await import("./route");
    const req = creerRequete(evenementValide, "ma-cle");
    const res = await POST(req);

    expect(res.status).toBe(503);
    const corps = await res.json();
    expect(corps.error).toMatch(/non configuré/i);
  });

  // ── 401 — clé API manquante ────────────────────────────────────────────────

  it("retourne 401 si le header X-API-Key est absent", async () => {
    const { POST } = await import("./route");
    const req = creerRequete(evenementValide); // pas de cleAPI
    const res = await POST(req);

    expect(res.status).toBe(401);
    const corps = await res.json();
    expect(corps.error).toMatch(/manquante/i);
  });

  // ── 403 — clé API invalide ────────────────────────────────────────────────

  it("retourne 403 si la clé n'existe pas dans KV", async () => {
    mockHgetall.mockResolvedValue(null);
    const { POST } = await import("./route");
    const req = creerRequete(evenementValide, "cle-inconnue");
    const res = await POST(req);

    expect(res.status).toBe(403);
    const corps = await res.json();
    expect(corps.error).toMatch(/invalide/i);
  });

  // ── 400 — corps JSON invalide ─────────────────────────────────────────────

  it("retourne 400 si le corps n'est pas du JSON valide", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/api/generate", {
      method: "POST",
      headers: { "X-API-Key": "ma-cle", "Content-Type": "application/json" },
      body: "{ pas du json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const corps = await res.json();
    expect(corps.error).toMatch(/json invalide/i);
  });

  // ── 400 — titre manquant dans une occurrence ─────────────────────────────

  it("retourne 400 si le titre d'une occurrence est absent ou vide", async () => {
    const { POST } = await import("./route");
    const req = creerRequete(
      {
        evenement: {
          occurrences: [{ ...evenementValide.occurrences[0], titre: "   " }],
        },
      },
      "ma-cle",
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const corps = await res.json();
    expect(corps.error).toMatch(/titre/i);
  });

  // ── 400 — aucune occurrence ───────────────────────────────────────────────

  it("retourne 400 si occurrences est un tableau vide", async () => {
    const { POST } = await import("./route");
    const req = creerRequete({ evenement: { ...evenementValide, occurrences: [] } }, "ma-cle");
    const res = await POST(req);

    expect(res.status).toBe(400);
    const corps = await res.json();
    expect(corps.error).toMatch(/occurrence/i);
  });

  // ── 400 — date invalide ───────────────────────────────────────────────────

  it("retourne 400 si une occurrence contient une dateDebut invalide", async () => {
    const { POST } = await import("./route");
    const req = creerRequete(
      {
        evenement: {
          ...evenementValide,
          occurrences: [{ ...evenementValide.occurrences[0], dateDebut: "pas-une-date" }],
        },
      },
      "ma-cle",
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const corps = await res.json();
    expect(corps.error).toMatch(/dateDebut/i);
  });

  // ── 200 — cas nominal ─────────────────────────────────────────────────────

  it("retourne 200 avec le fichier ICS et les bons headers", async () => {
    const { POST } = await import("./route");
    const req = creerRequete({ evenement: evenementValide }, "ma-cle");
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/calendar");
    expect(res.headers.get("Content-Disposition")).toContain(".ics");

    const texte = await res.text();
    expect(texte).toBe("BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n");
  });

  it("incrémente le compteur d'utilisation après une requête réussie", async () => {
    const { POST } = await import("./route");
    const req = creerRequete({ evenement: evenementValide }, "ma-cle");
    await POST(req);

    expect(mockHincrby).toHaveBeenCalledWith(expect.stringContaining("apikey:"), "usageCount", 1);
  });

  // ── 400 — dateFin invalide ────────────────────────────────────────────────

  it("retourne 400 si une occurrence contient une dateFin invalide", async () => {
    const { POST } = await import("./route");
    const req = creerRequete(
      {
        evenement: {
          ...evenementValide,
          occurrences: [{ ...evenementValide.occurrences[0], dateFin: "pas-une-date" }],
        },
      },
      "ma-cle",
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const corps = await res.json();
    expect(corps.error).toMatch(/dateFin/i);
  });

  // ── 400 — champ evenement absent ─────────────────────────────────────────

  it("retourne 400 si le corps ne contient pas le champ evenement", async () => {
    const { POST } = await import("./route");
    const req = creerRequete({}, "ma-cle");
    const res = await POST(req);

    expect(res.status).toBe(400);
    const corps = await res.json();
    expect(corps.error).toMatch(/occurrence/i);
  });

  // ── 400 — fuseau invalide dans options ────────────────────────────────────

  it("retourne 400 si options.fuseau est un identifiant invalide (genererICS lève une Error)", async () => {
    // On configure le mock pour simuler ce que genererICS ferait avec un fuseau invalide
    mockGenererICS.mockImplementationOnce(() => {
      throw new Error('Fuseau horaire invalide : "UTC+2". Utiliser un identifiant IANA comme "Europe/Paris".');
    });
    const { POST } = await import("./route");
    const req = creerRequete({ evenement: evenementValide, options: { fuseau: "UTC+2" } }, "ma-cle");
    const res = await POST(req);

    expect(res.status).toBe(400);
    const corps = await res.json();
    expect(corps.error).toMatch(/fuseau/i);
  });

  // ── 200 — nom de fichier dans Content-Disposition ─────────────────────────

  it("le nom de fichier dans Content-Disposition est basé sur le titre de la première occurrence", async () => {
    const { POST } = await import("./route");
    // Titre ASCII simple pour un résultat prévisible sans ambiguïté d'encodage
    const req = creerRequete(
      {
        evenement: {
          occurrences: [{ ...evenementValide.occurrences[0], titre: "Mon Evenement Test" }],
        },
      },
      "ma-cle",
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    // Les espaces sont remplacés par "_" — résultat attendu : Mon_Evenement_Test.ics
    expect(res.headers.get("Content-Disposition")).toContain("Mon_Evenement_Test.ics");
  });

  // ── 200 — options fuseau valide transmis à genererICS ────────────────────

  it("transmet les options (fuseau) à genererICS quand elles sont présentes", async () => {
    const { POST } = await import("./route");
    const req = creerRequete({ evenement: evenementValide, options: { fuseau: "America/New_York" } }, "ma-cle");
    await POST(req);

    // genererICS doit avoir été appelé avec les occurrences et les options
    expect(mockGenererICS).toHaveBeenCalledWith(
      expect.objectContaining({ occurrences: expect.any(Array) }),
      expect.objectContaining({ fuseau: "America/New_York" }),
    );
  });

  // ── 200 — compteur non incrémenté en cas d'erreur ─────────────────────────

  it("n'incrémente pas le compteur si genererICS lève une erreur", async () => {
    mockGenererICS.mockImplementationOnce(() => {
      throw new Error("Fuseau horaire invalide");
    });
    const { POST } = await import("./route");
    const req = creerRequete({ evenement: evenementValide, options: { fuseau: "UTC+2" } }, "ma-cle");
    await POST(req);

    expect(mockHincrby).not.toHaveBeenCalled();
  });
});
