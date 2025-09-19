const thisScript = document.currentScript;
const jsonPath = thisScript.getAttribute("data-json");

fetch(jsonPath)
  .then(res => res.json())
  .then(data => {
    document.getElementById("post-title").textContent = data.title;
    document.getElementById("post-subtitle").textContent = data.subtitle;

    const container = document.getElementById("post-content");
    data.sections.forEach(section => {
        const div = document.createElement("div");
        div.className = "section";

        const h2 = document.createElement("h2");
        h2.textContent = section.heading;
        div.appendChild(h2);

        const p = document.createElement("p");
        p.textContent = section.text;
        div.appendChild(p);

        // Handle images
      if (section.images) {
        section.images.forEach(imgData => {
          const img = document.createElement("img");
          img.src = imgData.src;
          img.className = "overlay";

          // Set initial CSS for position, transform, opacity, filter
          img.style.left = (imgData.offsetX || 0) + "px";
          img.style.top = (imgData.offsetY || 0) + "px";
          img.style.zIndex = imgData.placement === "below" ? (imgData.zIndex || 0) : (imgData.zIndex || 10);

          let transforms = [];
          if (imgData.rotateX) transforms.push(`rotateX(${imgData.rotateX}deg)`);
          if (imgData.rotateY) transforms.push(`rotateY(${imgData.rotateY}deg)`);
          if (imgData.rotateZ) transforms.push(`rotateZ(${imgData.rotateZ}deg)`);
          if (imgData.scale) transforms.push(`scale(${imgData.scale})`);
          img.style.transform = transforms.join(" ");

          if (imgData.opacity != null) img.style.opacity = imgData.opacity;
          if (imgData.filter) img.style.filter = imgData.filter;

          div.appendChild(img);

          // Apply chroma key after image is loaded
          if (imgData.keyColor) {
            img.onload = () => applyChromaKey(img, imgData.keyColor, imgData.keyStrength, imgData.filter);
          }
        });
      }

        container.appendChild(div);
        });
  })
  .catch(err => console.error("Failed to load JSON:", err));


function applyChromaKey(img, keyColorHex, keyStrength = 1, filter = "") {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const rKey = parseInt(keyColorHex.substr(1,2),16);
  const gKey = parseInt(keyColorHex.substr(3,2),16);
  const bKey = parseInt(keyColorHex.substr(5,2),16);

  const maxTolerance = 100 * keyStrength;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const dist = Math.sqrt((r-rKey)**2 + (g-gKey)**2 + (b-bKey)**2);
    if (dist < maxTolerance) {
      const alphaFactor = dist / maxTolerance;
      data[i+3] = data[i+3] * alphaFactor;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Copy CSS from img
  const computedStyle = window.getComputedStyle(img);
  canvas.style.position = computedStyle.position;
  canvas.style.left = computedStyle.left;
  canvas.style.top = computedStyle.top;
  canvas.style.zIndex = computedStyle.zIndex;
  canvas.style.transform = computedStyle.transform;
  canvas.style.opacity = computedStyle.opacity;
  canvas.style.width = computedStyle.width;
  canvas.style.height = computedStyle.height;
  canvas.className = img.className;

  // Apply the CSS filter explicitly
  if (filter) {
    canvas.style.filter = filter;
  }

  img.replaceWith(canvas);
  return canvas;
}