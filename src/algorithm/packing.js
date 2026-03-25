import { getOrientations, overlaps, getCandidatePositions } from "./geometry";
import { getContactScore, getFitMetrics } from "./scoring";
import { getUsedLength, compactPlacement } from "./compact";
import { tryFillGaps } from "./gaps";

export function buildBestRow(remainingUnits, vehicleWidth) {
  const pool = remainingUnits.slice(0, Math.min(18, remainingUnits.length));
  let bestRow = null;

  function isBetterRow(candidate, current) {
    if (!current) return true;
    const candidateUnused = vehicleWidth - candidate.widthUsed;
    const currentUnused = vehicleWidth - current.widthUsed;
    const candidateScore = [candidateUnused, candidate.depth, -candidate.area, -candidate.items.length];
    const currentScore = [currentUnused, current.depth, -current.area, -current.items.length];

    for (let i = 0; i < candidateScore.length; i += 1) {
      if (candidateScore[i] < currentScore[i]) return true;
      if (candidateScore[i] > currentScore[i]) return false;
    }
    return false;
  }

  function backtrack(startIndex, selected, widthUsed, depth, area, usedIndexes) {
    if (selected.length > 0) {
      const candidate = {
        items: [...selected],
        widthUsed,
        depth,
        area,
        usedIndexes: new Set(usedIndexes),
      };
      if (isBetterRow(candidate, bestRow)) bestRow = candidate;
      if (widthUsed === vehicleWidth) return;
    }

    for (let i = startIndex; i < pool.length; i += 1) {
      if (usedIndexes.has(i)) continue;
      const unit = pool[i];

      for (const orientation of getOrientations(unit)) {
        if (widthUsed + orientation.placedWidth > vehicleWidth) continue;

        usedIndexes.add(i);
        selected.push({
          ...unit,
          placedLength: orientation.placedLength,
          placedWidth: orientation.placedWidth,
          rotated: orientation.rotated,
        });

        backtrack(
          i + 1,
          selected,
          widthUsed + orientation.placedWidth,
          Math.max(depth, orientation.placedLength),
          area + orientation.placedLength * orientation.placedWidth,
          usedIndexes,
        );

        selected.pop();
        usedIndexes.delete(i);
      }
    }
  }

  backtrack(0, [], 0, 0, 0, new Set());
  return bestRow;
}

export function buildPlanByRows(units, vehicle, totalWeight) {
  const remainingUnits = [...units];
  const placed = [];
  const warnings = [];
  const unplaced = [];
  let xCursor = 0;

  if (totalWeight > vehicle.maxWeight) {
    warnings.push(`Totaalgewicht ${totalWeight} kg is hoger dan laadvermogen ${vehicle.maxWeight} kg.`);
  }

  while (remainingUnits.length > 0) {
    const bestRow = buildBestRow(remainingUnits, vehicle.width);
    if (!bestRow) break;
    if (xCursor + bestRow.depth > vehicle.length) break;

    let yCursor = 0;
    bestRow.items.forEach((item) => {
      placed.push({
        ...item,
        x: xCursor,
        y: yCursor,
      });
      yCursor += item.placedWidth;
    });

    xCursor += bestRow.depth;

    const indexesToRemove = [...bestRow.usedIndexes].sort((a, b) => b - a);
    indexesToRemove.forEach((index) => {
      remainingUnits.splice(index, 1);
    });
  }

  const afterGapFill = tryFillGaps(placed, remainingUnits, vehicle);
  afterGapFill.forEach((unit) => {
    unplaced.push({ ...unit, reason: "Past niet binnen de beschikbare laadruimte." });
  });

  const compactedPlaced = compactPlacement(placed);
  const usedLength = getUsedLength(compactedPlaced);
  const placedWeight = compactedPlaced.reduce((sum, item) => sum + item.weight, 0);
  const placedArea = compactedPlaced.reduce((sum, item) => sum + item.placedLength * item.placedWidth, 0);
  const footprintUtilization = Math.round((placedArea / (vehicle.length * vehicle.width)) * 100);
  const ldm = Math.round((placedArea / 24000) * 100) / 100;

  if (unplaced.length > 0) warnings.push(`${unplaced.length} collo konden niet geplaatst worden.`);

  return {
    placed: compactedPlaced,
    unplaced,
    usedLength,
    totalWeight,
    placedWeight,
    footprintUtilization,
    warnings,
    ldm,
  };
}

export function findBestPlacement(unit, placed, vehicle, commonWidths = []) {
  const currentUsedLength = getUsedLength(placed);
  let bestPlacement = null;

  for (const orientation of getOrientations(unit)) {
    if (orientation.placedWidth > vehicle.width || orientation.placedLength > vehicle.length) continue;

    const candidates = getCandidatePositions(placed, orientation, vehicle);
    for (const { x, y } of candidates) {
      const candidate = {
        ...unit,
        x,
        y,
        placedLength: orientation.placedLength,
        placedWidth: orientation.placedWidth,
        rotated: orientation.rotated,
      };
      if (placed.some((item) => overlaps(candidate, item))) continue;

      const candidateUsedLength = Math.max(currentUsedLength, candidate.x + candidate.placedLength);
      const addedLength = Math.max(0, candidateUsedLength - currentUsedLength);
      const fit = getFitMetrics(candidate, placed, vehicle, commonWidths);
      const contactScore = getContactScore(candidate, placed, vehicle);
      const candidateScore = [
        candidateUsedLength,
        addedLength,
        -(fit.verticalFitCount + fit.exactColumnBonus + fit.preservesCommonWidth),
        fit.verticalRemainder,
        -(fit.horizontalFitCount + fit.exactRowBonus),
        fit.horizontalRemainder,
        -contactScore,
        candidate.x,
        candidate.y,
        orientation.rotated ? 1 : 0,
      ];

      if (!bestPlacement) {
        bestPlacement = { ...candidate, _score: candidateScore };
        continue;
      }

      const bestScore = bestPlacement._score;
      for (let i = 0; i < candidateScore.length; i += 1) {
        if (candidateScore[i] < bestScore[i]) {
          bestPlacement = { ...candidate, _score: candidateScore };
          break;
        }
        if (candidateScore[i] > bestScore[i]) break;
      }
    }
  }

  if (!bestPlacement) return null;
  const { _score, ...placement } = bestPlacement;
  return placement;
}

export function buildPlanForOrderedUnits(units, vehicle, totalWeight) {
  const commonWidths = Array.from(new Set(units.map((unit) => Math.min(unit.length, unit.width)))).sort((a, b) => a - b);
  const placed = [];
  let unplaced = [];
  const warnings = [];

  if (totalWeight > vehicle.maxWeight) {
    warnings.push(`Totaalgewicht ${totalWeight} kg is hoger dan laadvermogen ${vehicle.maxWeight} kg.`);
  }

  for (const unit of units) {
    const bestPlacement = findBestPlacement(unit, placed, vehicle, commonWidths);
    if (bestPlacement) placed.push(bestPlacement);
    else unplaced.push({ ...unit, reason: "Past niet binnen de beschikbare laadruimte." });
  }

  placed.splice(0, placed.length, ...compactPlacement(placed));
  unplaced = tryFillGaps(
    placed,
    unplaced.map(({ reason, ...unit }) => unit),
    vehicle,
  ).map((unit) => ({ ...unit, reason: "Past niet binnen de beschikbare laadruimte." }));

  const compactedPlaced = compactPlacement(placed);
  const usedLength = getUsedLength(compactedPlaced);
  const placedWeight = compactedPlaced.reduce((sum, item) => sum + item.weight, 0);
  const placedArea = compactedPlaced.reduce((sum, item) => sum + item.placedLength * item.placedWidth, 0);
  const footprintUtilization = Math.round((placedArea / (vehicle.length * vehicle.width)) * 100);
  const ldm = Math.round((placedArea / 24000) * 100) / 100;

  if (unplaced.length > 0) warnings.push(`${unplaced.length} collo konden niet geplaatst worden.`);

  return {
    placed: compactedPlaced,
    unplaced,
    usedLength,
    totalWeight,
    placedWeight,
    footprintUtilization,
    warnings,
    ldm,
  };
}
