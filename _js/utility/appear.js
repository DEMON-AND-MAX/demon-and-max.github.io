export function applyChromaKey(img, keyColorHex, keyStrength = 1, filter = "") {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const rKey = parseInt(keyColorHex.slice(1, 3), 16);
  const gKey = parseInt(keyColorHex.slice(3, 5), 16);
  const bKey = parseInt(keyColorHex.slice(5, 7), 16);
  const maxTolerance = 100 * Number(keyStrength || 1);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.sqrt((r - rKey) ** 2 + (g - gKey) ** 2 + (b - bKey) ** 2);
    if (dist < maxTolerance) {
      data[i + 3] *= dist / maxTolerance;
    }
  }
  ctx.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0);

  const cs = window.getComputedStyle(img);
  ["position", "left", "top", "zIndex", "transform", "opacity", "width", "height"].forEach(prop => {
    canvas.style[prop] = cs[prop];
  });
  canvas.className = img.className;
  if (filter) canvas.style.filter = filter;

  img.replaceWith(canvas);
  return canvas;
}