import { getUsedLength } from "./compact";

export function recalcStats(placed, vehicle) {
  const usedLength = getUsedLength(placed);
  const placedWeight = placed.reduce((sum, item) => sum + item.weight, 0);
  const placedArea = placed.reduce((sum, item) => sum + item.placedLength * item.placedWidth, 0);
  const footprintUtilization = Math.round((placedArea / (vehicle.length * vehicle.width)) * 100);
  const ldm = Math.round((placedArea / 24000) * 100) / 100;
  return { usedLength, placedWeight, footprintUtilization, ldm };
}
