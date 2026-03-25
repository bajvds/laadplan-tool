import { expandLines } from "./compact";
import { buildPlanForOrderedUnits, buildPlanByRows } from "./packing";

export function makeFloorLoadPlan(lines, vehicle) {
  if (!vehicle) {
    return {
      placed: [],
      unplaced: [],
      usedLength: 0,
      totalWeight: 0,
      placedWeight: 0,
      footprintUtilization: 0,
      warnings: [],
      ldm: 0,
    };
  }

  const baseUnits = expandLines(lines);
  const totalWeight = baseUnits.reduce((sum, unit) => sum + unit.weight, 0);

  const orderings = [
    [...baseUnits].sort((a, b) => {
      if (a.length * a.width !== b.length * b.width) return a.length * a.width - b.length * b.width;
      return Math.max(a.length, a.width) - Math.max(b.length, b.width);
    }),
    [...baseUnits].sort((a, b) => {
      const aLongest = Math.max(a.length, a.width);
      const bLongest = Math.max(b.length, b.width);
      if (bLongest !== aLongest) return bLongest - aLongest;
      if (b.length * b.width !== a.length * a.width) return b.length * b.width - a.length * a.width;
      return b.weight - a.weight;
    }),
    [...baseUnits].sort((a, b) => {
      if (b.length * b.width !== a.length * a.width) return b.length * b.width - a.length * a.width;
      return Math.min(b.length, b.width) - Math.min(a.length, a.width);
    }),
  ];

  const plans = orderings.map((orderedUnits) => buildPlanForOrderedUnits(orderedUnits, vehicle, totalWeight));
  plans.push(
    buildPlanByRows(
      [...baseUnits].sort((a, b) => {
        if (b.length * b.width !== a.length * a.width) return b.length * b.width - a.length * a.width;
        return Math.max(b.length, b.width) - Math.max(a.length, a.width);
      }),
      vehicle,
      totalWeight,
    ),
  );
  plans.sort((a, b) => {
    if (a.unplaced.length !== b.unplaced.length) return a.unplaced.length - b.unplaced.length;
    if (a.usedLength !== b.usedLength) return a.usedLength - b.usedLength;
    return b.footprintUtilization - a.footprintUtilization;
  });
  return plans[0];
}
