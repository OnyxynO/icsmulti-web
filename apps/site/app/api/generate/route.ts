// Route Handler POST /api/generate
// Génère un fichier .ics à partir d'un événement passé en JSON.
// Authentification par clé API (header X-API-Key) hashée en SHA-256,
// stockée dans Upstash KV sous la clé `apikey:{hash}`.

import { type Evenement, genererICS, type OptionsExport } from "@icsmulti/core";
import type { NextRequest } from "next/server";
import { type CleAPI, hashCle, redis } from "@/lib/kv";

// Corps de requête attendu
interface CorpsRequete {
  evenement: Evenement;
  options?: OptionsExport;
}

export async function POST(request: NextRequest): Promise<Response> {
  // ── 1. Vérifier que Upstash est configuré ────────────────────────────────────
  if (!redis) {
    return Response.json({ error: "Service non configuré" }, { status: 503 });
  }

  // ── 2. Lire et valider la clé API ────────────────────────────────────────────
  const cleRecue = request.headers.get("X-API-Key");
  if (!cleRecue) {
    return Response.json({ error: "Clé API manquante" }, { status: 401 });
  }

  const hash = await hashCle(cleRecue);
  const cle = await redis.hgetall<CleAPI>(`apikey:${hash}`);

  if (!cle) {
    return Response.json({ error: "Clé API invalide" }, { status: 403 });
  }

  // ── 3. Parser et valider le corps JSON ───────────────────────────────────────
  let corps: CorpsRequete;
  try {
    corps = (await request.json()) as CorpsRequete;
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { evenement, options } = corps;

  if (!Array.isArray(evenement?.occurrences) || evenement.occurrences.length === 0) {
    return Response.json({ error: "L'événement doit contenir au moins une occurrence" }, { status: 400 });
  }

  // Valider que chaque occurrence a un titre non vide
  for (const occ of evenement.occurrences) {
    if (!occ.titre || (occ.titre as string).trim() === "") {
      return Response.json({ error: "Chaque occurrence doit avoir un titre non vide" }, { status: 400 });
    }
  }

  // Les dates arrivent en JSON sous forme de chaînes ISO — les reconvertir en Date
  // Valider chaque date : new Date() ne lève pas d'exception sur une chaîne invalide
  const occurrencesAvecDates = [];
  for (const occ of evenement.occurrences) {
    const dateDebut = new Date(occ.dateDebut as unknown as string);
    const dateFin = new Date(occ.dateFin as unknown as string);
    if (Number.isNaN(dateDebut.getTime())) {
      return Response.json({ error: "dateDebut invalide dans une occurrence" }, { status: 400 });
    }
    if (Number.isNaN(dateFin.getTime())) {
      return Response.json({ error: "dateFin invalide dans une occurrence" }, { status: 400 });
    }
    occurrencesAvecDates.push({ ...occ, dateDebut, dateFin });
  }

  const evenementAvecDates: Evenement = { occurrences: occurrencesAvecDates };

  // ── 4. Générer le fichier ICS ─────────────────────────────────────────────────
  let contenuICS: string;
  try {
    contenuICS = genererICS(evenementAvecDates, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de génération";
    return Response.json({ error: message }, { status: 400 });
  }

  // ── 5. Incrémenter le compteur d'utilisation ─────────────────────────────────
  // hincrby incrémente atomiquement un champ numérique dans un hash Redis
  await redis.hincrby(`apikey:${hash}`, "usageCount", 1);

  // ── 6. Retourner le fichier ICS ───────────────────────────────────────────────
  // Nom de fichier basé sur le titre de la première occurrence
  // Nom de fichier ASCII uniquement — filename="..." dans Content-Disposition ne supporte pas les accents (RFC 6266)
  const titreFichier = (evenement.occurrences[0].titre as string).trim() || "export";
  const nomFichier = `${titreFichier.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;

  return new Response(contenuICS, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
    },
  });
}
