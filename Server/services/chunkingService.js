function splitIntoTokenAwareChunks(text, options = {}) {
  const chunkSize = Number(options.chunkSize) || 800;
  const overlap = Number(options.overlap) || 100;

  if (!text || typeof text !== 'string') {
    return [];
  }

  const words = text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (!words.length) return [];

  const chunks = [];
  const step = Math.max(1, chunkSize - overlap);

  for (let start = 0; start < words.length; start += step) {
    const section = words.slice(start, start + chunkSize);
    if (!section.length) continue;
    chunks.push(section.join(' '));
    if (start + chunkSize >= words.length) break;
  }

  return chunks;
}

module.exports = {
  splitIntoTokenAwareChunks,
};
