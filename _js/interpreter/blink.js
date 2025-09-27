
import { renderParagraphSection } from "../object/light.js";

export default function blink({ jsonPath, cssPath, containerSelector }) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => blink({ jsonPath, cssPath, containerSelector }));
    return;
  }

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error("Interpreter: container not found for selector:", containerSelector);
    return;
  }

  const shadow = container.attachShadow({ mode: "open" });

  if (cssPath) {
    fetch(cssPath)
      .then(res => res.ok ? res.text() : Promise.reject("CSS fetch error: " + res.status))
      .then(cssText => {
        const style = document.createElement("style");
        style.textContent = cssText;
        shadow.appendChild(style);
      })
      .catch(err => console.error("Interpreter failed loading CSS:", cssPath, err));
  }

  const [titleEl, subtitleEl, contentEl] = [
    "post-title",
    "post-subtitle",
    "post-content"
  ].map(cls => {
    const el = document.createElement("div");
    el.className = cls;
    shadow.appendChild(el);
    return el;
  });

  fetch(jsonPath)
    .then(res => res.ok ? res.json() : Promise.reject("JSON fetch error: " + res.status))
    .then(data => {
      if (data.title) titleEl.textContent = data.title;
      if (data.subtitle) subtitleEl.textContent = data.subtitle;
      if (!Array.isArray(data.sections)) return;
      data.sections.forEach(section => {
        let div = null;
        if (section.type === "paragraph") div = renderParagraphSection(section);
        else console.warn("Interpreter: unknown section type:", section.type);
        if (div) contentEl.appendChild(div);
      });
    })
    .catch(err => console.error("Interpreter failed loading JSON:", jsonPath, err));
}