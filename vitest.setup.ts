import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined" && !("innerText" in document.createElement("div"))) {
  Object.defineProperty(HTMLElement.prototype, "innerText", {
    get() {
      return this.textContent ?? "";
    },
    set(value: string) {
      this.textContent = value;
    },
  });
}
