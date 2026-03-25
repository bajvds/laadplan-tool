import { getOrientations } from "./geometry";

export function findFreeRectanglesFromPlaced(placed, vehicle) {
  const xEdges = Array.from(new Set([0, vehicle.length, ...placed.flatMap((item) => [item.x, item.x + item.placedLength])])).sort((a, b) => a - b);
  const yEdges = Array.from(new Set([0, vehicle.width, ...placed.flatMap((item) => [item.y, item.y + item.placedWidth])])).sort((a, b) => a - b);

  const cells = [];
  for (let xi = 0; xi < xEdges.length - 1; xi += 1) {
    for (let yi = 0; yi < yEdges.length - 1; yi += 1) {
      const x = xEdges[xi];
      const y = yEdges[yi];
      const length = xEdges[xi + 1] - x;
      const width = yEdges[yi + 1] - y;
      if (length <= 0 || width <= 0) continue;

      const occupied = placed.some((item) => {
        const xOverlap = x < item.x + item.placedLength && x + length > item.x;
        const yOverlap = y < item.y + item.placedWidth && y + width > item.y;
        return xOverlap && yOverlap;
      });

      cells.push({ xi, yi, x, y, length, width, occupied, used: false });
    }
  }

  const cellMap = new Map(cells.map((cell) => [`${cell.xi}:${cell.yi}`, cell]));
  const rectangles = [];

  for (const cell of cells) {
    if (cell.occupied || cell.used) continue;

    let maxXi = cell.xi;
    while (true) {
      const next = cellMap.get(`${maxXi + 1}:${cell.yi}`);
      if (!next || next.occupied || next.used || next.y !== cell.y || next.width !== cell.width) break;
      maxXi += 1;
    }

    let maxYi = cell.yi;
    let canGrow = true;
    while (canGrow) {
      const nextYi = maxYi + 1;
      for (let xi = cell.xi; xi <= maxXi; xi += 1) {
        const next = cellMap.get(`${xi}:${nextYi}`);
        if (!next || next.occupied || next.used) {
          canGrow = false;
          break;
        }
      }
      if (canGrow) maxYi = nextYi;
    }

    for (let xi = cell.xi; xi <= maxXi; xi += 1) {
      for (let yi = cell.yi; yi <= maxYi; yi += 1) {
        const mark = cellMap.get(`${xi}:${yi}`);
        if (mark) mark.used = true;
      }
    }

    rectangles.push({
      x: xEdges[cell.xi],
      y: yEdges[cell.yi],
      length: xEdges[maxXi + 1] - xEdges[cell.xi],
      width: yEdges[maxYi + 1] - yEdges[cell.yi],
      area: (xEdges[maxXi + 1] - xEdges[cell.xi]) * (yEdges[maxYi + 1] - yEdges[cell.yi]),
    });
  }

  return rectangles.sort((a, b) => {
    if (b.area !== a.area) return b.area - a.area;
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });
}

export function chooseBestBulkPattern(rect, groups) {
  let best = null;

  Object.entries(groups).forEach(([groupKey, units]) => {
    if (!units.length) return;
    const unit = units[0];

    getOrientations(unit).forEach((orientation) => {
      if (orientation.placedLength > rect.length || orientation.placedWidth > rect.width) return;
      const cols = Math.floor(rect.length / orientation.placedLength);
      const rows = Math.floor(rect.width / orientation.placedWidth);
      const capacity = cols * rows;
      if (capacity <= 0) return;

      const placedCount = Math.min(capacity, units.length);
      const leftoverLength = rect.length - cols * orientation.placedLength;
      const leftoverWidth = rect.width - rows * orientation.placedWidth;
      const score = [-placedCount, leftoverWidth, leftoverLength, orientation.rotated ? 1 : 0];

      if (!best) {
        best = { groupKey, orientation, cols, rows, placedCount, score };
        return;
      }

      for (let i = 0; i < score.length; i += 1) {
        if (score[i] < best.score[i]) {
          best = { groupKey, orientation, cols, rows, placedCount, score };
          return;
        }
        if (score[i] > best.score[i]) return;
      }
    });
  });

  return best;
}

export function tryFillGaps(placed, remaining, vehicle) {
  const groups = remaining.reduce((acc, unit) => {
    const key = `${unit.description}|${unit.length}|${unit.width}|${unit.weight}|${unit.color}|${unit.lineIndex}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(unit);
    return acc;
  }, {});

  findFreeRectanglesFromPlaced(placed, vehicle).forEach((rect) => {
    const pattern = chooseBestBulkPattern(rect, groups);
    if (!pattern || pattern.placedCount <= 0) return;
    const pool = groups[pattern.groupKey];
    if (!pool || pool.length === 0) return;

    const count = Math.min(pattern.placedCount, pool.length);
    for (let index = 0; index < count; index += 1) {
      const unit = pool.shift();
      const col = Math.floor(index / pattern.rows);
      const row = index % pattern.rows;
      placed.push({
        ...unit,
        x: rect.x + col * pattern.orientation.placedLength,
        y: rect.y + row * pattern.orientation.placedWidth,
        placedLength: pattern.orientation.placedLength,
        placedWidth: pattern.orientation.placedWidth,
        rotated: pattern.orientation.rotated,
      });
    }
  });

  return Object.values(groups).flat();
}
