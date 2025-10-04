/**
 * Utility to create and attach a Shadow DOM with optional CSS
 */
export async function createShadowWithCSS(container, cssPath) {
  const shadow = container.attachShadow({ mode: "open" });

  if (cssPath) {
    try {
      const res = await fetch(cssPath);
      if (!res.ok) throw new Error("CSS fetch failed: " + res.status);
      const cssText = await res.text();
      const style = document.createElement("style");
      style.textContent = cssText;
      shadow.appendChild(style);
    } catch (err) {
      console.error("Interpreter: failed loading CSS:", cssPath, err);
    }
  }

  return shadow;
}

/**
 * Utility to create default structure for title/subtitle/content
 */
export function createBaseLayout(shadow) {
  const titleEl = document.createElement("div");
  titleEl.className = "post-title";

  const subtitleEl = document.createElement("div");
  subtitleEl.className = "post-subtitle";

  const contentEl = document.createElement("div");
  contentEl.className = "post-content";

  shadow.append(titleEl, subtitleEl, contentEl);
  return { titleEl, subtitleEl, contentEl };
}