import { describe, expect, it } from "vitest";
import { genererICS } from "./index.js";
describe("genererICS", () => {
    it("retourne une chaîne (stub)", () => {
        const resultat = genererICS({
            titre: "Test",
            notes: "",
            occurrences: [],
        });
        expect(typeof resultat).toBe("string");
    });
});
//# sourceMappingURL=index.test.js.map