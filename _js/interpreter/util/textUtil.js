/**
 * Load multiple files in parallel and extract specified sections.
 * Returns a single HTML string containing all extracted content.
 *
 * @param {Object} data - Object with file paths as keys and section arrays as values.
 * Example:
 * {
 *   "notes.txt": ["intro", "summary"],
 *   "report.docx": ["results"]
 * }
 * @returns {Promise<string>} - Single HTML string with all extracted sections.
 */
export async function loadFiles(data) {
  if (typeof data !== "object" || data === null) {
    throw new Error("<textUtil> invalid input: expected an object");
  }

  const fileEntries = Object.entries(data);

  const contentPromises = fileEntries.map(async ([filepath, sections]) => {
    try {
      if (filepath.endsWith(".txt")) {
        return await loadText(filepath, sections);
      } else if (filepath.endsWith(".docx")) {
        return await loadDocx(filepath, sections);
      } else {
        return `<textUtil> unsupported file type: ${filepath}`;
      }
    } catch (err) {
      return `<textUtil> error loading file ${filepath}: ${err.message}`;
    }
  });

  const contents = await Promise.all(contentPromises);

  // Merge all extracted content into a single string with separators (optional <hr>)
  return contents.join("<br>"); 
}

/**
 * Load a .txt file and optionally extract only given sections
 */
async function loadText(filepath, sections) {
  const res = await fetch(filepath);
  if (!res.ok) throw new Error(`Failed to load: ${filepath}`);
  const txt = await res.text();
  if (Array.isArray(sections) && sections.length > 0) {
    return extractSectionsFromText(txt, sections);
  }
  return escapeHtml(txt).replace(/\n/g, "<br>");
}

/**
 * Load a .docx file and optionally extract only given sections
 */
async function loadDocx(filepath, sections) {
  const res = await fetch(filepath);
  if (!res.ok) throw new Error(`Failed to load: ${filepath}`);
  const buffer = await res.arrayBuffer();

  if (!window.mammoth) {
    throw new Error("mammoth.js not loaded");
  }

  const result = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
  let content = result.value;

  if (Array.isArray(sections) && sections.length > 0) {
    content = extractSectionsFromHtml(content, sections);
  }

  return content || "[No text found]";
}

/**
 * Extract only specified sections from plain text
 * Uses [section name] markers.
 */
export function extractSectionsFromText(txt, sections) {
  if (!Array.isArray(sections) || sections.length === 0) return escapeHtml(txt).replace(/\n/g, "<br>");

  const lines = txt.split(/\r?\n/);
  const result = [];
  let currentSection = null;
  let collecting = false;

  for (const line of lines) {
    const match = line.match(/^\[section ([^\]]+)\]$/);
    if (match) {
      currentSection = match[1];
      collecting = sections.includes(currentSection);
      continue;
    }
    if (collecting && !/^\[section ([^\]]+)\]$/.test(line)) {
      result.push(line);
    }
  }

  return result.length ? escapeHtml(result.join("\n")).replace(/\n/g, "<br>") : "[No matching section found]";
}

/**
 * Extract specified sections from docx HTML (by converting to text first)
 */
export function extractSectionsFromHtml(html, sections) {
  if (!Array.isArray(sections) || sections.length === 0) return html;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  const extracted = extractSectionsFromText(text, sections);
  return extracted;
}

/**
 * Simple HTML escaping (prevents injection)
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}