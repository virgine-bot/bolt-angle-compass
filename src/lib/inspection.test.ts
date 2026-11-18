import { describe, expect, it } from "vitest";
import { getBoltStatus, needsRetake } from "./inspection";

describe("bolt status thresholds", () => {
  it("treats rotation under 5° as secure", () => {
    expect(getBoltStatus(4.9)).toBe("ok");
    expect(getBoltStatus(-4.9)).toBe("ok");
  });
  it("flags 5° up to under 15° for monitoring", () => {
    expect(getBoltStatus(5)).toBe("monitor");
    expect(getBoltStatus(-14.9)).toBe("monitor");
  });
  it("marks 15° or more as loose", () => {
    expect(getBoltStatus(15)).toBe("loose");
    expect(getBoltStatus(-27)).toBe("loose");
  });
});

describe("retake prompt", () => {
  it("asks for a retake when any bolt confidence is below 0.6", () => {
    expect(needsRetake([0.9, 0.55])).toBe(true);
  });
  it("asks for a retake when no bolts were detected", () => {
    expect(needsRetake([])).toBe(true);
  });
  it("accepts the photo when all confidences are 0.6 or higher", () => {
    expect(needsRetake([0.6, 0.92])).toBe(false);
  });
});
