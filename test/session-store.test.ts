import { strict as assert } from "node:assert";
import path from "node:path";
import test from "node:test";
import { resolveStoryLibraryRoot } from "../src/lib/session-store";

test("production story library scanning is opt-in through STORY_LIBRARY_ROOT", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalStoryLibraryRoot = process.env.STORY_LIBRARY_ROOT;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.STORY_LIBRARY_ROOT;

    assert.equal(resolveStoryLibraryRoot(), null);

    process.env.STORY_LIBRARY_ROOT = "../authorized-story-corpus";
    assert.equal(resolveStoryLibraryRoot(), path.resolve("../authorized-story-corpus"));
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalStoryLibraryRoot === undefined) delete process.env.STORY_LIBRARY_ROOT;
    else process.env.STORY_LIBRARY_ROOT = originalStoryLibraryRoot;
  }
});

test("development story library scanning keeps the local parent directory default", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalStoryLibraryRoot = process.env.STORY_LIBRARY_ROOT;

  try {
    process.env.NODE_ENV = "development";
    delete process.env.STORY_LIBRARY_ROOT;

    assert.equal(resolveStoryLibraryRoot(), path.resolve(process.cwd(), ".."));
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalStoryLibraryRoot === undefined) delete process.env.STORY_LIBRARY_ROOT;
    else process.env.STORY_LIBRARY_ROOT = originalStoryLibraryRoot;
  }
});
