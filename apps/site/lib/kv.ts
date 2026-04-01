// Client Redis Upstash partagé — singleton pour éviter les connexions multiples
// Utilisé par la route /api/generate et la page /api-key

import { Redis } from "@upstash/redis";

// ─── Client singleton ──────────────────────────────────────────────────────────

/**
 * Retourne null si les variables d'environnement Upstash sont absentes
 * (cas du développement local sans KV configuré).
 * La route /api/generate retourne 503 dans ce cas.
 */
function creerClientRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

export const redis = creerClientRedis();

// ─── Type stocké dans KV ───────────────────────────────────────────────────────

export type CleAPI = {
  createdAt: string; // ISO 8601
  label: string;
  usageCount: number;
  [key: string]: unknown; // requis par hset/hgetall Upstash
};

// ─── Utilitaire hash SHA-256 ───────────────────────────────────────────────────

/**
 * Calcule le hash SHA-256 d'une chaîne et retourne la représentation hex.
 * Utilise uniquement Web Crypto API — compatible Edge Runtime et Node.js.
 */
export async function hashCle(cle: string): Promise<string> {
  const encoder = new TextEncoder();
  const donnees = encoder.encode(cle);
  const hashBuffer = await crypto.subtle.digest("SHA-256", donnees);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
