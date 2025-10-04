import { createShadowWithCSS, createBaseLayout } from "./util/blinkUtil.js";
import { parse } from "./parse.js";

/**
 * Render JSON-driven content into container
 */
export default async function interpret({ jsonPath, cssPath, containerSelector }) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      interpret({ jsonPath, cssPath, containerSelector })
    );
    return;
  }

  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error("<blink> container not found:", containerSelector);
  }

  const shadow = await createShadowWithCSS(container, cssPath);
  const { titleEl, subtitleEl, contentEl } = createBaseLayout(shadow);

  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error("<blink> JSON fetch failed: " + res.status);
    const data = await res.json();

    if (data.title) titleEl.textContent = data.title;
    if (data.subtitle) subtitleEl.textContent = data.subtitle;

    if (!Array.isArray(data.sections)) {
      throw new Error("<blink> sections is not an array.");
    }

    // render sections
    for (const section of data.sections) {
      const sectionBase = "./section"
      const type = section.type;
      let renderer = null;

      try {
        const module = await import(`${sectionBase}/${type}.js`);
        renderer = module.default;
      } catch (err) {
        console.warn(`<blink> failed to load renderer for type "${type}":`, err);
        continue;
      }

      if (typeof renderer !== "function") {
        console.warn(`<blink> renderer for type "${type}" is not a function.`);
        continue;
      }

      const parsedData = parse(section);
      console.log(parsedData);
      const el = await renderer(parsedData, section);
      console.log(el);
      if (el) contentEl.appendChild(el);
    }
  } catch (err) {
    console.error("<blink> failed loading JSON:", jsonPath, err);
  }
}
