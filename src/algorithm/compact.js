import { toNumber } from "../utils/helpers";
import { COLORS } from "../data/defaults";

export function expandLines(lines) {
  const units = [];
  lines.forEach((line, lineIndex) => {
    const qty = Math.max(0, toNumber(line.qty));
    const length = toNumber(line.length);
    const width = toNumber(line.width);
    const weight = toNumber(line.weight);

    for (let i = 0; i < qty; i += 1) {
      units.push({
        id: `${lineIndex}-${i}`,
        lineIndex,
        sequence: i + 1,
        description: line.description || `Item ${lineIndex + 1}`,
        length,
        width,
        weight,
        color: line.color || COLORS[lineIndex % COLORS.length],
      });
    }
  });
  return units;
}

export function getUsedLength(placed) {
  return placed.length ? Math.max(...placed.map((item) => item.x + item.placedLength)) : 0;
}

export function compactPlacement(placed) {
  let current = placed.map((item) => ({ ...item }));

  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false;
    current = current
      .map((item, index) => ({ ...item, _index: index }))
      .sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

    current = current.map((item, index, arr) => {
      let newX = 0;
      arr.forEach((other, otherIndex) => {
        if (otherIndex === index) return;
        const yOverlap = item.y < other.y + other.placedWidth && item.y + item.placedWidth > other.y;
        if (yOverlap && other.x + other.placedLength <= item.x) newX = Math.max(newX, other.x + other.placedLength);
      });
      if (newX !== item.x) changed = true;
      return { ...item, x: newX };
    });

    current = current.map(({ _index, ...item }) => item);
    if (!changed) break;
  }

  return current;
}
