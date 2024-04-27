import { describe, test, expect, afterEach } from "vitest";
import { imageTips } from "./imageTips";

describe("imageTips()", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });
  test("div", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    expect(imageTips(element)).toEqual([]);
  });
  test("img with alt", () => {
    const element = document.createElement("img");
    element.setAttribute("alt", "Hello");
    element.setAttribute("src", "hello.png");
    document.body.appendChild(element);
    expect(imageTips(element)).toEqual([{ type: "name", content: "Hello" }]);
  });

  test("img without alt", () => {
    const element = document.createElement("img");
    element.setAttribute("src", "hello.png");
    document.body.appendChild(element);
    expect(imageTips(element)).toEqual([
      { type: "error", content: "messages.noAltImage" },
    ]);
  });

  test("img with empty alt", () => {
    const element = document.createElement("img");
    element.setAttribute("alt", "");
    element.setAttribute("src", "hello.png");
    document.body.appendChild(element);
    expect(imageTips(element)).toEqual([
      { type: "warning", content: "messages.emptyAltImage" },
    ]);
  });

  test("svg", () => {
    const element = document.createElement("svg");
    document.body.appendChild(element);
    const result = imageTips(element);
    expect(result.find((e) => e.type === "tagName")).toEqual({
      type: "tagName",
      content: "svg",
    });
    expect(result.find((e) => e.type === "name")).toBeUndefined();
    expect(result.find((e) => e.type === "error")).toEqual({
      type: "error",
      content: "messages.noName",
    });
  });
});