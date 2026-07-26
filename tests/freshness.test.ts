import { describe, expect, it } from "vitest";
import { filterFresh, isFresh } from "../src/lib/freshness";

describe("isFresh", () => {
  const now = new Date("2026-07-26T12:00:00+02:00");

  it("is fresh when verified recently and no expiresAt is set (within default max age)", () => {
    expect(isFresh({ verifiedAt: "2026-07-26T10:00:00+02:00" }, now)).toBe(true);
  });

  it("is stale once the default 6h max age has elapsed with no expiresAt", () => {
    expect(isFresh({ verifiedAt: "2026-07-26T05:00:00+02:00" }, now)).toBe(false);
  });

  it("is fresh when now is before an explicit expiresAt, regardless of verifiedAt age", () => {
    const item = {
      verifiedAt: "2026-07-20T10:00:00+02:00",
      expiresAt: "2026-07-26T13:00:00+02:00",
    };
    expect(isFresh(item, now)).toBe(true);
  });

  it("is stale once now reaches an explicit expiresAt (fail closed at the boundary)", () => {
    const item = {
      verifiedAt: "2026-07-20T10:00:00+02:00",
      expiresAt: "2026-07-26T12:00:00+02:00",
    };
    expect(isFresh(item, now)).toBe(false);
  });

  it("fails closed when verifiedAt is missing or unparseable", () => {
    expect(isFresh({ verifiedAt: "" }, now)).toBe(false);
    expect(isFresh({ verifiedAt: "not-a-date" }, now)).toBe(false);
  });

  it("fails closed when expiresAt is present but unparseable", () => {
    const item = { verifiedAt: "2026-07-26T10:00:00+02:00", expiresAt: "not-a-date" };
    expect(isFresh(item, now)).toBe(false);
  });
});

describe("filterFresh", () => {
  it("keeps only fresh items and preserves relative order", () => {
    const now = new Date("2026-07-26T12:00:00+02:00");
    const items = [
      { id: "a", verifiedAt: "2026-07-26T11:00:00+02:00" },
      { id: "b", verifiedAt: "2026-07-20T00:00:00+02:00" },
      { id: "c", verifiedAt: "2026-07-26T09:00:00+02:00" },
    ];

    expect(filterFresh(items, now).map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("returns an empty array when nothing is fresh", () => {
    const now = new Date("2026-07-26T12:00:00+02:00");
    const items = [{ id: "a", verifiedAt: "2020-01-01T00:00:00+02:00" }];
    expect(filterFresh(items, now)).toEqual([]);
  });
});
