import { describe, expect, it } from "vitest";
import { createElement, greet } from "./index.js";

describe("greet", () => {
  it("returns a greeting string", () => {
    expect(greet("tdkit")).toBe("Hello, tdkit!");
  });
});

describe("createElement", () => {
  it("creates a DOM element with the given tag", () => {
    const el = createElement("div");
    expect(el).toBeInstanceOf(HTMLDivElement);
    expect(el.tagName).toBe("DIV");
  });

  it("applies optional props", () => {
    const el = createElement("button", { type: "submit", disabled: true });
    expect(el.type).toBe("submit");
    expect(el.disabled).toBe(true);
  });
});
