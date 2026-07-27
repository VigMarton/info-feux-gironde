import { describe, expect, it } from "vitest";
import { localePath, PAGE_SEGMENTS } from "../src/lib/routes";

describe("localePath", () => {
  it("builds home and section paths with trailing slash", () => {
    expect(localePath("fr")).toBe("/fr/");
    expect(localePath("en", "situation")).toBe("/en/situation/");
    expect(localePath("de", "other")).toBe("/de/other/");
  });

  it("covers home plus four triage sections", () => {
    expect(PAGE_SEGMENTS).toEqual(["", "situation", "evacuation", "help", "other"]);
  });
});
