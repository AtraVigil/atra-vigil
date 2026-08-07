import assert from "node:assert/strict";
import test from "node:test";

import { parseRecipientList } from "../lib/structuraEmail.js";

test("single recipient remains supported", () => {
  assert.deepEqual(
    parseRecipientList("jcsimmonsholdings@gmail.com"),
    ["jcsimmonsholdings@gmail.com"],
  );
});

test("comma-separated recipients are trimmed", () => {
  assert.deepEqual(
    parseRecipientList(
      "jcsimmonsholdings@gmail.com, second@example.com ,third@example.org",
    ),
    [
      "jcsimmonsholdings@gmail.com",
      "second@example.com",
      "third@example.org",
    ],
  );
});

test("duplicate recipients are removed", () => {
  assert.deepEqual(
    parseRecipientList(
      "jcsimmonsholdings@gmail.com,jcsimmonsholdings@gmail.com",
    ),
    ["jcsimmonsholdings@gmail.com"],
  );
});

test("empty entries are ignored", () => {
  assert.deepEqual(
    parseRecipientList(
      "jcsimmonsholdings@gmail.com, ,second@example.com,",
    ),
    ["jcsimmonsholdings@gmail.com", "second@example.com"],
  );
});

test("invalid recipient configuration fails closed", () => {
  assert.deepEqual(
    parseRecipientList(
      "jcsimmonsholdings@gmail.com,not-an-email",
    ),
    [],
  );
});

test("missing recipient configuration fails closed", () => {
  assert.deepEqual(parseRecipientList(undefined), []);
  assert.deepEqual(parseRecipientList(""), []);
});
