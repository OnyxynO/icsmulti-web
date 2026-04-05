"use client";

// Composant client — charge le bundle IIFE /widget.js et lance la démo live.
// Séparé en Client Component pour pouvoir utiliser next/script avec onLoad.
//
// Deux chemins d'initialisation :
// - Premier chargement : onLoad déclenche init() une fois le script en mémoire
// - Navigation côté client (changement de langue, retour page) : useEffect détecte
//   que window.ICSMulti est déjà disponible et réinitialise directement

import Script from "next/script";
import { useEffect } from "react";

interface PropsDemoWidget {
  lang: "fr" | "en";
}

// Déclaration minimale pour que TypeScript accepte window.ICSMulti
declare global {
  interface Window {
    ICSMulti?: { init: (opts: object) => void };
  }
}

function initWidget(lang: string) {
  const conteneur = document.getElementById("icsmulti-widget-demo");
  if (!conteneur || !window.ICSMulti) return;
  conteneur.replaceChildren(); // vider le conteneur avant réinitialisation
  window.ICSMulti.init({ container: "#icsmulti-widget-demo", theme: "light", lang });
}

export default function DemoWidget({ lang }: PropsDemoWidget) {
  // Réinitialise le widget quand lang change, ou au montage si le script est déjà chargé
  // (navigation côté client : next/script ne redéclenche pas onLoad)
  useEffect(() => {
    initWidget(lang);
  }, [lang]);

  return (
    <>
      <div id="icsmulti-widget-demo" />
      <Script src="/widget.js" strategy="afterInteractive" onLoad={() => initWidget(lang)} />
    </>
  );
}
