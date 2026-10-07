import test from "node:test";
import assert from "node:assert/strict";
import { validateInput, detectRedFlags, parseModelOutput, applySafety, normalizeRisk, enrichContext } from "./pipeline.js";

test("validation", () => {
  assert.ok(validateInput({}).error);
  assert.ok(validateInput({ input: 5 }).error);
  assert.ok(validateInput({ input: "   " }).error);
  assert.ok(validateInput({ input: "a".repeat(2001) }).error);
  assert.equal(validateInput({ input: " turmeric " }).input, "turmeric");
});
test("red flags", () => {
  assert.deepEqual(detectRedFlags("persistent fever and difficulty breathing"), ["difficulty breathing"]);
  assert.equal(detectRedFlags("turmeric and black pepper").length, 0);
});
test("risk normalization & parsing", () => {
  assert.equal(normalizeRisk("moderate"), "Moderate");
  assert.equal(normalizeRisk("???"), null);
  assert.equal(parseModelOutput("not json"), null);
  const ok = parseModelOutput('```json\n{"summary":"s","benefits":["a"],"warnings":[],"recommendation":"r","riskLevel":"low"}\n```');
  assert.equal(ok.riskLevel, "Low");
});
test("safety only raises risk", () => {
  const r = applySafety({ summary: "s", benefits: [], warnings: [], recommendation: "r", riskLevel: "Low" }, ["chest pain"]);
  assert.equal(r.riskLevel, "High");
  assert.ok(r.safety.emergency);
});
test("enrichment", () => assert.ok(enrichContext("Turmeric and black pepper").length >= 2));
