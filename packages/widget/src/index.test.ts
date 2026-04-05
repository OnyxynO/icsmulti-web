import { beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "./index.js";

// ── Mocks APIs navigateur absentes de jsdom ────────────────────────────────

// matchMedia n'est pas implémenté dans jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockReturnValue({ matches: false }),
});

// URL.createObjectURL / revokeObjectURL ne sont pas dans jsdom
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn().mockReturnValue("blob:mock"),
});
Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
});

// ── Helpers ────────────────────────────────────────────────────────────────

/** Crée un conteneur avec l'id donné dans le body et retourne l'élément. */
function creerConteneur(id = "icsmulti-widget"): HTMLElement {
  const div = document.createElement("div");
  div.id = id;
  document.body.appendChild(div);
  return div;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  document.body.innerHTML = "";
  // Retirer le style injecté entre les tests pour vérifier l'injection idempotente
  document.getElementById("icsmulti-styles")?.remove();
  vi.clearAllMocks();
});

describe("init() — conteneur", () => {
  it("affiche un warning si le conteneur est introuvable", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    init({ container: "#inexistant" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("#inexistant"));
    warn.mockRestore();
  });

  it("ne modifie pas le DOM si le conteneur est introuvable", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    init({ container: "#inexistant" });
    expect(document.body.innerHTML).toBe("");
  });

  it("utilise #icsmulti-widget par défaut", () => {
    creerConteneur();
    init();
    expect(document.querySelector(".icsmulti-widget")).not.toBeNull();
  });

  it("utilise le sélecteur personnalisé", () => {
    creerConteneur("mon-widget");
    init({ container: "#mon-widget" });
    expect(document.querySelector(".icsmulti-widget")).not.toBeNull();
  });
});

describe("init() — CSS", () => {
  it("injecte un <style id='icsmulti-styles'> dans le head", () => {
    creerConteneur();
    init();
    expect(document.getElementById("icsmulti-styles")).not.toBeNull();
  });

  it("n'injecte le CSS qu'une seule fois si init() est appelé plusieurs fois", () => {
    creerConteneur("w1");
    creerConteneur("w2");
    init({ container: "#w1" });
    init({ container: "#w2" });
    const styles = document.querySelectorAll("#icsmulti-styles");
    expect(styles).toHaveLength(1);
  });
});

describe("init() — thème", () => {
  it("applique icsmulti-light avec theme: 'light'", () => {
    creerConteneur();
    init({ theme: "light" });
    const conteneur = document.getElementById("icsmulti-widget");
    expect(conteneur?.classList.contains("icsmulti-light")).toBe(true);
    expect(conteneur?.classList.contains("icsmulti-dark")).toBe(false);
  });

  it("applique icsmulti-dark avec theme: 'dark'", () => {
    creerConteneur();
    init({ theme: "dark" });
    const conteneur = document.getElementById("icsmulti-widget");
    expect(conteneur?.classList.contains("icsmulti-dark")).toBe(true);
    expect(conteneur?.classList.contains("icsmulti-light")).toBe(false);
  });

  it("applique icsmulti-dark avec theme: 'auto' quand matchMedia retourne dark", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    creerConteneur();
    init({ theme: "auto" });
    const conteneur = document.getElementById("icsmulti-widget");
    expect(conteneur?.classList.contains("icsmulti-dark")).toBe(true);
  });

  it("applique icsmulti-light avec theme: 'auto' quand matchMedia retourne light", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    creerConteneur();
    init({ theme: "auto" });
    const conteneur = document.getElementById("icsmulti-widget");
    expect(conteneur?.classList.contains("icsmulti-light")).toBe(true);
  });
});

describe("init() — i18n", () => {
  it("affiche les libellés FR avec lang: 'fr'", () => {
    creerConteneur();
    init({ lang: "fr" });
    expect(document.body.textContent).toContain("Créer un événement .ics");
    expect(document.body.textContent).toContain("Télécharger .ics");
  });

  it("affiche les libellés EN avec lang: 'en'", () => {
    creerConteneur();
    init({ lang: "en" });
    expect(document.body.textContent).toContain("Create an .ics event");
    expect(document.body.textContent).toContain("Download .ics");
  });
});

describe("init() — structure du formulaire", () => {
  beforeEach(() => {
    creerConteneur();
    init({ lang: "fr" });
  });

  it("contient un champ titre", () => {
    expect(document.querySelector('[data-champ="titre"]')).not.toBeNull();
  });

  it("contient les champs date début et fin", () => {
    expect(document.querySelector('[data-champ="debut"]')).not.toBeNull();
    expect(document.querySelector('[data-champ="fin"]')).not.toBeNull();
  });

  it("contient la case journée entière", () => {
    expect(document.querySelector('[data-champ="journee"]')).not.toBeNull();
  });

  it("contient le bouton de téléchargement", () => {
    expect(document.querySelector('[data-action="telecharger"]')).not.toBeNull();
  });

  it("contient le lien d'attribution", () => {
    expect(document.querySelector(".icsmulti-attribution")).not.toBeNull();
  });
});

describe("validation — téléchargement", () => {
  beforeEach(() => {
    creerConteneur();
    init({ lang: "fr" });
  });

  function cliquerTelecharger(): void {
    const bouton = document.querySelector<HTMLButtonElement>('[data-action="telecharger"]');
    bouton?.click();
  }

  it("affiche une erreur si le titre est vide", () => {
    cliquerTelecharger();
    const erreur = document.querySelector<HTMLElement>('[data-erreur="titre"]');
    expect(erreur?.textContent).toContain("obligatoire");
  });

  it("affiche une erreur si la date de début est vide", () => {
    const titre = document.querySelector<HTMLInputElement>('[data-champ="titre"]');
    if (titre) titre.value = "Mon événement";
    cliquerTelecharger();
    const erreur = document.querySelector<HTMLElement>('[data-erreur="debut"]');
    expect(erreur?.textContent).toBeTruthy();
  });

  it("affiche une erreur si la date de fin est vide", () => {
    const titre = document.querySelector<HTMLInputElement>('[data-champ="titre"]');
    const debut = document.querySelector<HTMLInputElement>('[data-champ="debut"]');
    if (titre) titre.value = "Mon événement";
    if (debut) debut.value = "2025-06-15T10:00";
    cliquerTelecharger();
    const erreur = document.querySelector<HTMLElement>('[data-erreur="fin"]');
    expect(erreur?.textContent).toBeTruthy();
  });

  it("affiche une erreur si la fin est avant le début", () => {
    const titre = document.querySelector<HTMLInputElement>('[data-champ="titre"]');
    const debut = document.querySelector<HTMLInputElement>('[data-champ="debut"]');
    const fin = document.querySelector<HTMLInputElement>('[data-champ="fin"]');
    if (titre) titre.value = "Mon événement";
    if (debut) debut.value = "2025-06-15T10:00";
    if (fin) fin.value = "2025-06-15T09:00";
    cliquerTelecharger();
    const erreur = document.querySelector<HTMLElement>('[data-erreur="fin"]');
    expect(erreur?.textContent).toContain("après le début");
  });

  it("déclenche le téléchargement avec des données valides", () => {
    const titre = document.querySelector<HTMLInputElement>('[data-champ="titre"]');
    const debut = document.querySelector<HTMLInputElement>('[data-champ="debut"]');
    const fin = document.querySelector<HTMLInputElement>('[data-champ="fin"]');
    if (titre) titre.value = "Mon événement";
    if (debut) debut.value = "2025-06-15T10:00";
    if (fin) fin.value = "2025-06-15T11:00";
    cliquerTelecharger();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("efface les erreurs précédentes avant une nouvelle soumission valide", () => {
    // Premier clic sans données : génère des erreurs
    cliquerTelecharger();
    // Deuxième clic avec données valides : les erreurs doivent être effacées
    const titre = document.querySelector<HTMLInputElement>('[data-champ="titre"]');
    const debut = document.querySelector<HTMLInputElement>('[data-champ="debut"]');
    const fin = document.querySelector<HTMLInputElement>('[data-champ="fin"]');
    if (titre) titre.value = "Mon événement";
    if (debut) debut.value = "2025-06-15T10:00";
    if (fin) fin.value = "2025-06-15T11:00";
    cliquerTelecharger();
    const erreurTitre = document.querySelector<HTMLElement>('[data-erreur="titre"]');
    expect(erreurTitre?.textContent).toBe("");
  });
});

describe("journée entière — comportement des inputs date", () => {
  beforeEach(() => {
    creerConteneur();
    init({ lang: "fr" });
  });

  it("les inputs passent en type 'date' quand journée entière est cochée", () => {
    const checkbox = document.querySelector<HTMLInputElement>('[data-champ="journee"]');
    if (checkbox) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change"));
    }
    const debut = document.querySelector<HTMLInputElement>('[data-champ="debut"]');
    const fin = document.querySelector<HTMLInputElement>('[data-champ="fin"]');
    expect(debut?.type).toBe("date");
    expect(fin?.type).toBe("date");
  });

  it("les inputs reviennent en type 'datetime-local' quand journée entière est décochée", () => {
    const checkbox = document.querySelector<HTMLInputElement>('[data-champ="journee"]');
    if (checkbox) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change"));
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change"));
    }
    const debut = document.querySelector<HTMLInputElement>('[data-champ="debut"]');
    expect(debut?.type).toBe("datetime-local");
  });
});
