import { COLORS } from "../data/defaults";

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateLineLdm(line) {
  const length = toNumber(line.length);
  const width = toNumber(line.width);
  const qty = toNumber(line.qty);
  return Math.round(((length * width * qty) / 24000) * 100) / 100;
}

export function parsePastedRows(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  return trimmed
    .split(/\n+/)
    .map((row) => row.split(/\t|;|,/).map((cell) => cell.trim()))
    .filter((row) => row.length >= 5)
    .map((row, index) => ({
      id: crypto.randomUUID(),
      description: row[0],
      length: toNumber(row[1]),
      width: toNumber(row[2]),
      weight: toNumber(row[3]),
      qty: toNumber(row[4]),
      color: COLORS[index % COLORS.length],
    }))
    .filter((row) => row.description && row.length > 0 && row.width > 0 && row.qty > 0);
}
