import { applyChromaKey } from "./object/util/imageUtil.js";

export default async function paragraph(data) {
  const metadata = data.metadata;

  const div = document.createElement("div");
  div.className = "section " + metadata.style;

  // Add heading if available
  if (metadata.heading) {
    const h2 = document.createElement("h2");
    h2.textContent = metadata.heading;
    div.appendChild(h2);
  }

  // Apply container transform styles
  setBoxStyles(div, data.transform);

  // Add paragraph text
  const pContainer = document.createElement("div");
  pContainer.className = "paragraph " + metadata.style;
  try {
    const textContent = await data.text; // data.text is a Promise
    pContainer.innerHTML = textContent;
  } catch (err) {
    throw new Error("<paragraph> failed to load text: " + (err && err.message ? err.message : err));
  }
  div.appendChild(pContainer);

  // Add images
  if (data.images && typeof data.images === "object") {
    for (const [src, imgOpts] of Object.entries(data.images)) {
      div.appendChild(createImage({ src, ...imgOpts }));
    }
  }

  // zIndex from transform
  if (data.transform?.zIndex != null) {
    div.style.zIndex = data.transform.zIndex;
  }

  return div;

// Apply transform and positioning styles to the container
function setBoxStyles(el, opts) {
  if (opts.width) el.style.width = typeof opts.width === "number" ? opts.width + "px" : opts.width;
  else el.style.removeProperty("width");

  if (opts.height) el.style.height = typeof opts.height === "number" ? opts.height + "px" : opts.height;
  else el.style.removeProperty("height");

  if (opts.offsetX != null) el.style.left = opts.offsetX;
  if (opts.offsetY != null) el.style.top = opts.offsetY;

  if (opts.position === "absolute" || opts.offsetX != null || opts.offsetY != null) {
    el.style.position = opts.position || "absolute";
  }

  const transforms = [
    opts.rotateX ? `rotateX(${opts.rotateX})` : "",
    opts.rotateY ? `rotateY(${opts.rotateY})` : "",
    opts.rotateZ ? `rotateZ(${opts.rotateZ})` : "",
    opts.scale ? `scale(${opts.scale})` : ""
  ].filter(Boolean);

  if (transforms.length) {
    el.style.transform = transforms.join(" ");
    el.style.perspective = opts.perspective || "600px";
    el.style.transformStyle = "preserve-3d";
  }

  if (opts.className) el.classList.add(opts.className);
}

// Create <img> element with transforms, positioning, and optional chroma key
function createImage(imgData) {
  console.log(imgData);
  if (!imgData || !imgData.src) return document.createComment("Invalid image data");
  const img = document.createElement("img");
  img.src = imgData.src;
  img.className = imgData.style || "";
  img.style.position = imgData.position || "absolute";
  img.style.left = typeof imgData.offsetX === "number" ? imgData.offsetX + "px" : (imgData.offsetX ?? "0");
  img.style.top = typeof imgData.offsetY === "number" ? imgData.offsetY + "px" : (imgData.offsetY ?? "0");
  img.style.zIndex = imgData.zIndex ?? "";

  // Handle rotation and scale from parseImageMetadata
  const transforms = [];
  if (imgData.rotateX) transforms.push(`rotateX(${addUnit(imgData.rotateX, 'deg')})`);
  if (imgData.rotateY) transforms.push(`rotateY(${addUnit(imgData.rotateY, 'deg')})`);
  if (imgData.rotateZ) transforms.push(`rotateZ(${addUnit(imgData.rotateZ, 'deg')})`);
  // Support scaleX/scaleY or scale
  if (imgData.scaleX !== undefined || imgData.scaleY !== undefined) {
    const sx = imgData.scaleX !== undefined ? Number(imgData.scaleX) : 1;
    const sy = imgData.scaleY !== undefined ? Number(imgData.scaleY) : 1;
    transforms.push(`scale(${sx},${sy})`);
  } else if (imgData.scale !== undefined) {
    transforms.push(`scale(${Number(imgData.scale)})`);
  }
  if (transforms.length) img.style.transform = transforms.join(" ");

  if (imgData.opacity != null) img.style.opacity = imgData.opacity;
  if (imgData.filter) img.style.filter = imgData.filter;

  if (imgData.keyColor) {
    img.addEventListener("load", () => {
      try {
        applyChromaKey(img, imgData.keyColor, imgData.keyStrength, imgData.filter);
      } catch (err) {
        console.warn("<paragraph> chroma-key failed:", err);
      }
    });
  }

  return img;
}

function addUnit(val, unit) {
  if (typeof val === "string" && val.endsWith(unit)) return val;
  return val + unit;
}
}
