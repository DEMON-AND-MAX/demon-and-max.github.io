import { normalizeUnit, get, extractVector } from "./util/parseUtil.js";
import { loadFiles } from "./util/textUtil.js";

/**
 * Main parser entry point
 */
export function parse(data) {
  const parsed = {};

  parsed.type = data?.type ?? "paragraph";
  parsed.metadata = parseMetadata(data.metadata);
  parsed.transform = parseTransform(data.transform);
  parsed.text = parseText(data.text);
  parsed.images = parseImages(data.image);

  return parsed;
}

function parseMetadata(data) {
  if (!data) return {};
  return {
    id: get(data, "id"),
    title: get(data, "title"),
    heading: get(data, "heading"),
    style: get(data, "style")
  };
}

function parseTransform(data = {}) {
  const transform = {};

  // Helper to apply units only to numbers, leave strings as-is
  function applyUnit(val, unit) {
    if (typeof val === "number") return `${val}${unit}`;
    return val;
  }

  // Vector fields (with shorthand + overrides)
  // offset: rem, rotate: deg, scale: no unit
  const offset = extractVector(data, "offset", ["X", "Y"], [0, 0]);
  for (const k of Object.keys(offset)) {
    offset[k] = applyUnit(offset[k], "rem");
  }
  Object.assign(transform, offset);

  const rotate = extractVector(data, "rotate", ["X", "Y", "Z"], [0, 0, 0]);
  for (const k of Object.keys(rotate)) {
    rotate[k] = applyUnit(rotate[k], "deg");
  }
  Object.assign(transform, rotate);

  const scale = extractVector(data, "scale", ["X", "Y"], [1, 1]);
  // scale is unitless, but preserve string if present
  Object.assign(transform, scale);

  // Size (width/height: rem)
  const width = get(data, "width", 0);
  transform.width = typeof width === "number" ? `${width}rem` : width;
  const height = get(data, "height", 0);
  transform.height = typeof height === "number" ? `${height}rem` : height;

  // Positioning
  transform.position = get(data, "position", "static");
  transform.zIndex = get(data, "zIndex", 0);

  return transform;
}

function parseText(data) {
  if (!data) return null;

  let out = {};

  // object with paths as keys and sections as values
  if (typeof data === "object" && !Array.isArray(data)) {
    for (const [path, val] of Object.entries(data)) {
      out[path] = Array.isArray(val) ? val : null;
    }
  } else
  // array of text paths 
  if (Array.isArray(data)) {
    const out = {};
    data.forEach(path => {
      if (typeof path === "string") out[path] = null;
    });
  } else 
  // single text path
  if (typeof data === "string") {
    out[data] = null;
  } else {
    throw new Error("<parse> invalid text data.");
  }

  return loadFiles(out).then(data => data);
}

function parseImages(data) {
  if (!data) return null;

  // images with metadata
  if (typeof data === "object" && !Array.isArray(data)) {
    const out = {};

    // single image with metadata
    if (typeof data.src === "string") {
      out[data.src] = parseImageMetadata(data);
    }

    // multiple images with metadata
    for (const [path, val] of Object.entries(data)) {
      out[path] = parseImageMetadata(val);
    }

    return out;
  }

  // array of image paths
  if (Array.isArray(data)) {
    const out = {};
    data.forEach(path => {
      if (typeof path === "string") out[path] = null;
    });
    return out;
  }

  // single image path
  if (typeof data === "string") return { [data]: null };

  return null;
}

function parseImageMetadata(data = {}) {
  const meta = {};

  // Helper to apply units only to numbers, leave strings as-is
  function applyUnit(val, unit) {
    if (typeof val === "number") return `${val}${unit}`;
    return val;
  }

  // offset: rem
  const offset = extractVector(data, "offset", ["X", "Y"], [0, 0]);
  for (const k of Object.keys(offset)) {
    offset[k] = applyUnit(offset[k], "rem");
  }
  Object.assign(meta, offset);

  // rotate: deg
  const rotate = extractVector(data, "rotate", ["X", "Y", "Z"], [0, 0, 0]);
  for (const k of Object.keys(rotate)) {
    rotate[k] = applyUnit(rotate[k], "deg");
  }
  Object.assign(meta, rotate);

  // scale: unitless
  const scale = extractVector(data, "scale", ["X", "Y"], [1, 1]);
  Object.assign(meta, scale);

  meta.position = get(data, "position", "static");
  meta.zIndex = get(data, "zIndex", 0);
  meta.style = get(data, "style", "overlay");
  meta.opacity = get(data, "opacity", 1);
  meta.filter = get(data, "filter", "");
  meta.keyColor = get(data, "keyColor", null);
  meta.keyStrength = get(data, "keyStrength", 0.7);

  return meta;
}