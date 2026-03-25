export function getContactScore(candidate, placed, vehicle) {
  let score = 0;
  if (candidate.x === 0) score += 3;
  if (candidate.y === 0) score += 2;
  if (candidate.y + candidate.placedWidth === vehicle.width) score += 2;

  placed.forEach((item) => {
    const yOverlap = candidate.y < item.y + item.placedWidth && candidate.y + candidate.placedWidth > item.y;
    const xOverlap = candidate.x < item.x + item.placedLength && candidate.x + candidate.placedLength > item.x;

    if (yOverlap) {
      if (candidate.x + candidate.placedLength === item.x) score += 3;
      if (item.x + item.placedLength === candidate.x) score += 3;
    }
    if (xOverlap) {
      if (candidate.y + candidate.placedWidth === item.y) score += 2;
      if (item.y + item.placedWidth === candidate.y) score += 2;
    }
  });

  return score;
}

export function getFreeSpan(candidate, placed, vehicle) {
  let left = 0;
  let right = vehicle.length;
  let top = 0;
  let bottom = vehicle.width;

  placed.forEach((item) => {
    const yOverlap = candidate.y < item.y + item.placedWidth && candidate.y + candidate.placedWidth > item.y;
    const xOverlap = candidate.x < item.x + item.placedLength && candidate.x + candidate.placedLength > item.x;

    if (yOverlap) {
      if (item.x + item.placedLength <= candidate.x) left = Math.max(left, item.x + item.placedLength);
      if (item.x >= candidate.x + candidate.placedLength) right = Math.min(right, item.x);
    }
    if (xOverlap) {
      if (item.y + item.placedWidth <= candidate.y) top = Math.max(top, item.y + item.placedWidth);
      if (item.y >= candidate.y + candidate.placedWidth) bottom = Math.min(bottom, item.y);
    }
  });

  return {
    freeLength: Math.max(0, right - left),
    freeWidth: Math.max(0, bottom - top),
  };
}

export function getFitMetrics(candidate, placed, vehicle, commonWidths = []) {
  const { freeLength, freeWidth } = getFreeSpan(candidate, placed, vehicle);
  const verticalFitCount = candidate.placedWidth > 0 ? Math.floor(freeWidth / candidate.placedWidth) : 0;
  const verticalRemainder = candidate.placedWidth > 0 ? freeWidth % candidate.placedWidth : freeWidth;
  const horizontalFitCount = candidate.placedLength > 0 ? Math.floor(freeLength / candidate.placedLength) : 0;
  const horizontalRemainder = candidate.placedLength > 0 ? freeLength % candidate.placedLength : freeLength;
  const exactColumnBonus = verticalRemainder === 0 ? 20 : 0;
  const exactRowBonus = horizontalRemainder === 0 ? 10 : 0;
  const preservesCommonWidth = commonWidths.some((width) => width > 0 && verticalRemainder % width === 0) ? 8 : 0;

  return {
    verticalFitCount,
    verticalRemainder,
    horizontalFitCount,
    horizontalRemainder,
    exactColumnBonus,
    exactRowBonus,
    preservesCommonWidth,
  };
}
