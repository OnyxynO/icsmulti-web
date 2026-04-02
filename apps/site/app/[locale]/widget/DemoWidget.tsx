"use client";

// Composant client — charge le bundle IIFE /widget.js et lance la démo live.
// Séparé en Client Component pour pouvoir utiliser next/script avec onLoad.

import Script from "next/script";

interface PropsDemoWidget {
	lang: "fr" | "en";
}

// Déclaration minimale pour que TypeScript accepte window.ICSMulti
declare global {
	interface Window {
		ICSMulti?: { init: (opts: object) => void };
	}
}

export default function DemoWidget({ lang }: PropsDemoWidget) {
	return (
		<>
			<div id="icsmulti-widget-demo" />
			<Script
				src="/widget.js"
				strategy="afterInteractive"
				onLoad={() => {
					window.ICSMulti?.init({
						container: "#icsmulti-widget-demo",
						theme: "light",
						lang,
					});
				}}
			/>
		</>
	);
}
