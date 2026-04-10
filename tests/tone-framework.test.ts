import test from "node:test";
import assert from "node:assert/strict";

import {
  applyTone,
  defaultToneConfigs,
  renderTaskForHomeScreen,
  tonePhrases,
  type ToneProfile
} from "../src/index";

const profiles: ToneProfile[] = [
  "playful",
  "strict",
  "affirming",
  "teasing",
  "dominant-teasing"
];

test("all tone profiles have default config and phrase pools", () => {
  for (const profile of profiles) {
    assert.ok(defaultToneConfigs[profile], `missing config for ${profile}`);
    assert.ok(tonePhrases[profile], `missing phrases for ${profile}`);
    assert.ok(tonePhrases[profile].openers.length > 0, `${profile} has no openers`);
    assert.ok(
      tonePhrases[profile].midSentenceModifiers.length > 0,
      `${profile} has no modifiers`
    );
    assert.ok(tonePhrases[profile].closers.length > 0, `${profile} has no closers`);
  }
});

test("applyTone creates concise, deterministic output", () => {
  const task = "Complete the warmup set";
  const first = applyTone(task, "dominant-teasing");
  const second = applyTone(task, "dominant-teasing");

  assert.equal(first, second);
  assert.ok(first.includes(task));
  assert.equal(first.split("\n\n").length, 3);
});

test("custom flavor key remains optional and safe by default", () => {
  defaultToneConfigs.playful.customFlavorKey = "my-private-mode";
  const result = applyTone("Hold the plank for 45 seconds", "playful");
  delete defaultToneConfigs.playful.customFlavorKey;

  assert.ok(result.includes("Hold the plank for 45 seconds"));
});

test("home screen rendering applies tone without changing selected task", () => {
  const selectedTaskText = "Track spending for the day";
  const vm = renderTaskForHomeScreen(selectedTaskText, "affirming");

  assert.equal(vm.selectedTaskText, selectedTaskText);
  assert.equal(vm.activeTone, "affirming");
  assert.notEqual(vm.renderedTaskText, selectedTaskText);
  assert.ok(vm.renderedTaskText.includes(selectedTaskText));
});
