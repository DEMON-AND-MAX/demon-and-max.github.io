/**
 * Utility to load data objects from a given path
 */
export async function loadData(dataPath) {
  const res = await fetch(dataPath);
  if (!res.ok) throw new Error("<blinkUtil> data fetch failed: " + res.status);
  const info = getInfo(res.json());
  const data = getSections(res.json());
  return { info, data };
}

function getInfo(data) {
  if (!data.info) throw new Error("<blinkUtil> data missing info.");
  return data.info;
}

function getSections(data) {
  if (!data.sections) throw new Error("<blinkUtil> data missing sections.");
  if (!Array.isArray(data.sections)) {
    throw new Error("<blinkUtil> sections is not an array.");
  }
  return data.section;
}

/**
 * Utility to create and attach a Shadow DOM with optional CSS
 */
export async function createShadow(container, cssPath) {
  const shadow = container.attachShadow({ mode: "open" });

  if (cssPath) {
    try {
      const res = await fetch(cssPath);
      if (!res.ok) throw new Error("<blinkUtil> CSS fetch failed: " + res.status);
      const cssText = await res.text();
      const style = document.createElement("style");
      style.textContent = cssText;
      shadow.appendChild(style);
    } catch (err) {
      console.error("<blinkUtil> failed loading CSS:", cssPath, err);
    }
  }

  return shadow;
}

/**
 * Utility to create default structure for content
 */
export function createLayout(shadow) {
  const contentEl = document.createElement("div");
  contentEl.className = "page content";

  shadow.append(contentEl);
  return { contentEl };
}

/**
 * Utility to get renderer function for a specific section type
 */
export async function getRenderer(type, basePath = "section") {
  const module = await import(`../${basePath}/${type}.js`);
  
  if (typeof module.default !== "function") {
    throw new Error(`<blink> renderer for type "${type}" is not a function.`);
  }

  return module.default;
}