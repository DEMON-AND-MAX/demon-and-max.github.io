import { createShadow, loadData, createLayout, getRenderer } from "./util/blinkUtil.js";
import { parse } from "./parse.js";

/**
 * Render JSON-driven content into container
 */
export default async function interpret({ dataPath, containerSelector }) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      interpret({ dataPath, containerSelector })
    );
    return;
  }

  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error("<blink> container not found:", containerSelector);
  }

  const { info, sections } = await loadData(dataPath);

  const shadow = await createShadow(container, info.css);
  const { contentEl } = createLayout(shadow);

  // render sections
  for (const section of sections) {
    const renderer = getRenderer(section.type);
    const parsed = parse(section);
    const el = await renderer(parsed);
    contentEl.appendChild(el);
  }
}
