import { applyChromaKey } from "../utility/appear.js";

export function renderParagraphSection(section) {
  const div = document.createElement("div");
  div.className = "section";
  if (section.heading) {
    const h2 = document.createElement("h2");
    h2.textContent = section.heading;
    div.appendChild(h2);
  }
  const opts = section.position || {};
  setBoxStyles(div, opts);
  div.appendChild(createParagraphs(section.text, section.id, section.className));
  if (opts.zIndex) div.style.zIndex = opts.zIndex;
  if (Array.isArray(section.images)) {
    section.images.forEach(imgData => div.appendChild(createImage(imgData)));
  }
  return div;
}

function setBoxStyles(el, opts) {
  if (opts.width) el.style.width = typeof opts.width === "number" ? opts.width + "px" : opts.width;
  else el.style.removeProperty("width");
  if (opts.height) el.style.height = typeof opts.height === "number" ? opts.height + "px" : opts.height;
  else el.style.removeProperty("height");
  if (opts.offsetX != null) el.style.left = opts.offsetX + "px";
  if (opts.offsetY != null) el.style.top = opts.offsetY + "px";
  if (opts.className) el.classList.add(opts.className);
  const transforms = [
    opts.rotateX ? `rotateX(${opts.rotateX}deg)` : "",
    opts.rotateY ? `rotateY(${opts.rotateY}deg)` : "",
    opts.rotateZ ? `rotateZ(${opts.rotateZ}deg)` : ""
  ].filter(Boolean);
  if (transforms.length) {
    el.style.transform = transforms.join(" ");
    el.style.perspective = opts.perspective || "600px";
    el.style.transformStyle = "preserve-3d";
  }
  if (opts.position === "absolute" || opts.offsetX != null || opts.offsetY != null) {
    el.style.position = opts.position || "absolute";
  }
}

function extractSection(text, sectionId) {
  const lines = text.split(/\r?\n/);
  let collecting = false;
  let collected = [];
  for (let line of lines) {
    const match = line.match(/^\[section ([^\]]+)\]$/);
    if (match) {
      if (collecting) break;
      collecting = match[1] === sectionId;
      continue;
    }
    if (collecting && !/^\[section ([^\]]+)\]$/.test(line)) collected.push(line);
  }
  return collected;
}

function createParagraphs(textArr, sectionId, className) {
  const container = document.createElement("div");
  container.className = className ? className : "paragraph";
  if (!Array.isArray(textArr)) return container;
  textArr.forEach(path => {
    const p = document.createElement("p");
    if (typeof path === "string" && path.endsWith('.docx')) {
      fetch(path)
        .then(res => res.ok ? res.arrayBuffer() : Promise.reject(res.statusText))
        .then(buffer => {
          if (window.mammoth) {
            window.mammoth.convertToHtml({ arrayBuffer: buffer })
              .then(result => {
                const collected = extractSection(result.value, sectionId);
                p.innerHTML = collected.length ? collected.join("<br>") : "[No matching section found]";
              })
              .catch(() => { p.textContent = "[Failed to parse DOCX]"; });
          } else {
            p.textContent = "[mammoth.js not loaded]";
          }
        })
        .catch(() => { p.textContent = "[Failed to load DOCX]"; });
    } else if (typeof path === "string") {
      fetch(path)
        .then(res => res.ok ? res.text() : Promise.reject(res.statusText))
        .then(txt => {
          const collected = extractSection(txt, sectionId);
          p.innerHTML = collected.length ? collected.join("<br>") : "[No matching section found]";
        })
        .catch(() => { p.textContent = "[Failed to load paragraph]"; });
    } else {
      p.textContent = "[Invalid paragraph path]";
    }
    container.appendChild(p);
  });
  return container;
}

function createImage(imgData) {
  const img = document.createElement("img");
  img.src = imgData.src;
  img.className = imgData.className || "overlay";
  img.style.position = imgData.position || "absolute";
  img.style.left = (imgData.offsetX ?? 0) + "px";
  img.style.top = (imgData.offsetY ?? 0) + "px";
  img.style.zIndex = imgData.zIndex || 0;
  const transforms = [
    imgData.rotateX ? `rotateX(${imgData.rotateX}deg)` : "",
    imgData.rotateY ? `rotateY(${imgData.rotateY}deg)` : "",
    imgData.rotateZ ? `rotateZ(${imgData.rotateZ}deg)` : "",
    imgData.scale ? `scale(${imgData.scale})` : ""
  ].filter(Boolean);
  if (transforms.length) img.style.transform = transforms.join(" ");
  if (imgData.opacity != null) img.style.opacity = imgData.opacity;
  if (imgData.filter) img.style.filter = imgData.filter;
  if (imgData.keyColor) {
    img.addEventListener("load", () => {
      try {
        applyChromaKey(img, imgData.keyColor, imgData.keyStrength, imgData.filter);
      } catch (err) {
        console.warn("Chroma-key failed:", err);
      }
    });
  }
  return img;
}