// blink.js (modular-safe)
(function () {
  // Find the script tag that invoked this file (fallback to last script)
  const thisScript = document.currentScript || document.scripts[document.scripts.length - 1];

  // Read attributes
  const jsonPath = thisScript.getAttribute("data-json");
  const containerSelector = thisScript.getAttribute("data-container") || "body";

  // Resolve container early and bail if missing
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error("Interpreter: container not found for selector:", containerSelector);
    return;
  }

  // Local helper to safely query elements inside the container
  const q = sel => container.querySelector(sel);

  // Optional: fallback target elements inside the container (use classes for reusability)
  const titleEl = q(".post-title");
  const subtitleEl = q(".post-subtitle");
  const contentEl = q(".post-content");

  // Fetch and render
  fetch(jsonPath)
    .then(res => {
      if (!res.ok) throw new Error("Fetch error: " + res.status + " " + res.statusText);
      return res.json();
    })
    .then(data => {
      if (titleEl && data.title != null) titleEl.textContent = data.title;
      if (subtitleEl && data.subtitle != null) subtitleEl.textContent = data.subtitle;

      if (!Array.isArray(data.sections)) return;

      data.sections.forEach(section => {
        const div = document.createElement("div");
        div.className = "section";

        const h2 = document.createElement("h2");
        h2.textContent = section.heading || "";
        div.appendChild(h2);

        const p = document.createElement("p");
        if (Array.isArray(section.text)) {
          // `.flat()` is convenient; if you need IE11 support replace with reduce
          p.textContent = section.text.flat().join(" ");
        } else {
          p.textContent = section.text || "";
        }
        div.appendChild(p);

        // Images (if present)
        if (Array.isArray(section.images)) {
          section.images.forEach(imgData => {
            const img = document.createElement("img");
            img.src = imgData.src;
            img.className = imgData.className || "overlay";

            // position + transforms
            if (imgData.offsetX != null) img.style.left = imgData.offsetX + "px";
            if (imgData.offsetY != null) img.style.top = imgData.offsetY + "px";
            img.style.zIndex = imgData.placement === "below" ? (imgData.zIndex || 0) : (imgData.zIndex || 10);

            const transforms = [];
            if (imgData.rotateX) transforms.push(`rotateX(${imgData.rotateX}deg)`);
            if (imgData.rotateY) transforms.push(`rotateY(${imgData.rotateY}deg)`);
            if (imgData.rotateZ) transforms.push(`rotateZ(${imgData.rotateZ}deg)`);
            if (imgData.scale) transforms.push(`scale(${imgData.scale})`);
            if (transforms.length) img.style.transform = transforms.join(" ");

            if (imgData.opacity != null) img.style.opacity = imgData.opacity;
            if (imgData.filter) img.style.filter = imgData.filter;

            // Append image to section
            div.appendChild(img);

            // If chroma key requested, apply after load; but guard against CORS errors
            if (imgData.keyColor) {
              img.addEventListener("load", () => {
                try {
                  applyChromaKey(img, imgData.keyColor, imgData.keyStrength, imgData.filter);
                } catch (err) {
                  console.warn("Chroma-key failed (likely CORS or invalid image):", err);
                }
              });
            }
          });
        }

        if (contentEl) contentEl.appendChild(div);
        else container.appendChild(div); // fallback: append to container root
      });
    })
    .catch(err => console.error("Interpreter failed loading JSON:", jsonPath, err));

  // Local chroma-key function (scoped per-instance)
  function applyChromaKey(img, keyColorHex, keyStrength = 1, filter = "") {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // This will throw if the image is cross-origin without proper CORS headers
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const rKey = parseInt(keyColorHex.substr(1, 2), 16);
      const gKey = parseInt(keyColorHex.substr(3, 2), 16);
      const bKey = parseInt(keyColorHex.substr(5, 2), 16);

      const maxTolerance = 100 * (Number(keyStrength) || 1);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const dist = Math.sqrt((r - rKey) ** 2 + (g - gKey) ** 2 + (b - bKey) ** 2);
        if (dist < maxTolerance) {
          const alphaFactor = dist / maxTolerance;
          data[i + 3] = data[i + 3] * alphaFactor;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Copy a subset of useful styles
      const cs = window.getComputedStyle(img);
      canvas.style.position = cs.position;
      canvas.style.left = cs.left;
      canvas.style.top = cs.top;
      canvas.style.zIndex = cs.zIndex;
      canvas.style.transform = cs.transform;
      canvas.style.opacity = cs.opacity;
      canvas.style.width = cs.width;
      canvas.style.height = cs.height;
      canvas.className = img.className;
      if (filter) canvas.style.filter = filter;

      img.replaceWith(canvas);
      return canvas;
    } catch (e) {
      // If getImageData failed (CORS), rethrow so the caller can handle/log
      throw e;
    }
  }
})();