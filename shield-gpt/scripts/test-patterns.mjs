import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile("src/patterns.js", "utf8");
const sandbox = { window: {} };

vm.runInNewContext(source, sandbox, { filename: "src/patterns.js" });

const { scan, randomize } = sandbox.window.SensitiveChatGuardPatterns;

function typesFor(text) {
  return Array.from(scan(text), (finding) => finding.type);
}

{
  const text = "Send mail to abi@example.com with key sk-proj-abcdefghijklmnopqrstuvwxyz1234567890";
  assert.deepEqual(typesFor(text), ["email", "openai-key"]);
}

{
  const text = "password=super-secret-value";
  const [finding] = scan(text);

  assert.equal(finding.type, "secret-assignment");
  assert.equal(finding.value, "super-secret-value");
  assert.match(randomize(text, [finding]), /^password=/);
  assert.doesNotMatch(randomize(text, [finding]), /super-secret-value/);
}

{
  const text = "Card: 4242 4242 4242 4242 and test number 1234 5678 9012 3456";
  const findings = scan(text);

  assert.equal(findings.filter((finding) => finding.type === "credit-card").length, 1);
  assert.equal(findings.find((finding) => finding.type === "credit-card").value, "4242 4242 4242 4242");
}

{
  assert.deepEqual(typesFor("Internal router 192.168.1.1"), []);
  assert.deepEqual(typesFor("Public resolver 8.8.8.8"), ["public-ipv4"]);
}

{
  const text = "dob: 1998-04-22";
  const [finding] = scan(text);
  const next = randomize(text, [finding]);

  assert.equal(finding.type, "date-of-birth");
  assert.match(next, /^dob: \d{4}-\d{2}-\d{2}$/);
  assert.notEqual(next, text);
}

console.log("Pattern tests passed.");
