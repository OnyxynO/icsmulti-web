"use server";

// Actions serveur pour la page /api-key
// Ce fichier marque tout son contenu comme Server Actions (directive fichier-level).

import { redis, hashCle, type CleAPI } from "@/lib/kv";

export interface ResultatCreation {
	cleGeneree?: string;
	erreur?: string;
}

/**
 * Crée une nouvelle clé API :
 * - Génère un UUID v4 (clé brute, affichée une seule fois)
 * - Hash en SHA-256 (seul le hash est stocké dans Upstash KV)
 * - Stocke { createdAt, label, usageCount: 0 } sous `apikey:{hash}`
 */
export async function creerCleAPI(
	_etatPrecedent: ResultatCreation,
	formData: FormData,
): Promise<ResultatCreation> {
	if (!redis) {
		return {
			erreur:
				"Service non configuré — variables d'environnement Upstash manquantes.",
		};
	}

	const label = (formData.get("label") as string | null)?.trim() ?? "";

	// crypto.randomUUID() est disponible en Edge Runtime et Node.js 19+
	const clebrute = crypto.randomUUID();
	const hash = await hashCle(clebrute);

	const donnees: CleAPI = {
		createdAt: new Date().toISOString(),
		label,
		usageCount: 0,
	};

	// Seul le hash est persisté — la clé brute n'est jamais stockée
	await redis.hset(`apikey:${hash}`, donnees);

	return { cleGeneree: clebrute };
}
