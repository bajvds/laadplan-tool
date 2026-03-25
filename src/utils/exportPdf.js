import { jsPDF } from "jspdf";

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [200, 200, 200];
}

function drawFloorPlan(pdf, plan, vehicle, offsetX, offsetY, drawWidth, drawHeight) {
  const scaleX = drawWidth / vehicle.length;
  const scaleY = drawHeight / vehicle.width;

  // Floor background
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(160, 174, 192);
  pdf.setLineWidth(0.3);
  pdf.rect(offsetX, offsetY, drawWidth, drawHeight, "FD");

  // Grid lines
  pdf.setDrawColor(220, 226, 232);
  pdf.setLineWidth(0.1);
  const tickStep = Math.max(100, Math.round(vehicle.length / 6 / 10) * 10);
  for (let tick = tickStep; tick < vehicle.length; tick += tickStep) {
    const x = offsetX + tick * scaleX;
    pdf.line(x, offsetY, x, offsetY + drawHeight);
  }
  const midW = Math.round(vehicle.width / 2);
  const midY = offsetY + midW * scaleY;
  pdf.line(offsetX, midY, offsetX + drawWidth, midY);

  // Tick labels
  pdf.setFontSize(6);
  pdf.setTextColor(100, 116, 139);
  for (let tick = 0; tick <= vehicle.length; tick += tickStep) {
    pdf.text(String(tick), offsetX + tick * scaleX, offsetY - 1, { align: "center" });
  }
  if (vehicle.length % tickStep !== 0) {
    pdf.text(String(vehicle.length), offsetX + drawWidth, offsetY - 1, { align: "center" });
  }
  pdf.text("0", offsetX - 1, offsetY + 2, { align: "right" });
  pdf.text(String(midW), offsetX - 1, midY + 1, { align: "right" });
  pdf.text(String(vehicle.width), offsetX - 1, offsetY + drawHeight + 1, { align: "right" });

  // Placed items
  plan.placed.forEach((item) => {
    const x = offsetX + item.x * scaleX;
    const y = offsetY + item.y * scaleY;
    const w = item.placedLength * scaleX;
    const h = item.placedWidth * scaleY;

    const [r, g, b] = hexToRgb(item.color);
    pdf.setFillColor(r, g, b);
    pdf.setDrawColor(51, 65, 85);
    pdf.setLineWidth(0.2);
    pdf.rect(x, y, w, h, "FD");

    // Label inside item (only if big enough)
    if (w > 8 && h > 4) {
      pdf.setFontSize(5);
      pdf.setTextColor(30, 41, 59);
      const label = `${item.description} #${item.sequence}`;
      const dims = `${item.placedLength}x${item.placedWidth}`;
      pdf.text(label, x + w / 2, y + h / 2 - 1, { align: "center" });
      pdf.text(dims, x + w / 2, y + h / 2 + 2, { align: "center" });
    }
  });

  pdf.setTextColor(0, 0, 0);
}

export async function exportPlanAsPdf(_visualElement, plan, vehicle) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Title
  pdf.setFontSize(16);
  pdf.text(`Laadplan - ${vehicle.name}`, 14, 15);

  pdf.setFontSize(10);
  pdf.text(new Date().toLocaleDateString("nl-NL"), 14, 22);

  // Stats
  pdf.setFontSize(11);
  const stats = [
    `Voertuig: ${vehicle.name} (${vehicle.length} x ${vehicle.width} cm)`,
    `Totaal gewicht: ${plan.totalWeight} kg  |  Geplaatst: ${plan.placedWeight} kg`,
    `Benutte lengte: ${plan.usedLength} cm  |  Vloerbenutting: ${plan.footprintUtilization}%`,
    `Laadmeters: ${plan.ldm} LDM`,
  ];
  stats.forEach((line, i) => pdf.text(line, 14, 30 + i * 6));

  // Draw floor plan
  const planOffsetX = 20;
  const planOffsetY = 60;
  const planWidth = 255;
  const planHeight = (vehicle.width / vehicle.length) * planWidth;
  const clampedHeight = Math.min(planHeight, 110);
  const actualWidth = clampedHeight === planHeight ? planWidth : (clampedHeight / planHeight) * planWidth;

  drawFloorPlan(pdf, plan, vehicle, planOffsetX, planOffsetY, actualWidth, clampedHeight);

  // Unplaced items
  if (plan.unplaced.length > 0) {
    const yStart = planOffsetY + clampedHeight + 8;
    pdf.setFontSize(10);
    pdf.setTextColor(190, 18, 60);
    pdf.text("Niet passend:", 14, yStart);
    pdf.setFontSize(9);
    plan.unplaced.forEach((item, i) => {
      pdf.text(`- ${item.description} (${item.length}x${item.width} cm, ${item.weight} kg): ${item.reason}`, 18, yStart + 5 + i * 5);
    });
    pdf.setTextColor(0, 0, 0);
  }

  // Warnings
  if (plan.warnings.length > 0) {
    const yStart = planOffsetY + clampedHeight + (plan.unplaced.length > 0 ? 8 + 5 + plan.unplaced.length * 5 : 0) + 8;
    pdf.setFontSize(10);
    pdf.text("Waarschuwingen:", 14, yStart);
    pdf.setFontSize(9);
    plan.warnings.forEach((w, i) => pdf.text(`- ${w}`, 18, yStart + 5 + i * 5));
  }

  // Legend
  const legendY = planOffsetY + clampedHeight + 6;
  const legendX = actualWidth + planOffsetX + 10;
  if (legendX < 270) {
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Legenda:", legendX, planOffsetY);
    const seenColors = new Map();
    plan.placed.forEach((item) => {
      if (!seenColors.has(item.color)) seenColors.set(item.color, item.description);
    });
    let li = 0;
    seenColors.forEach((desc, color) => {
      const [r, g, b] = hexToRgb(color);
      pdf.setFillColor(r, g, b);
      pdf.setDrawColor(100, 116, 139);
      pdf.setLineWidth(0.15);
      pdf.rect(legendX, planOffsetY + 3 + li * 6, 4, 3, "FD");
      pdf.setFontSize(7);
      pdf.text(desc, legendX + 6, planOffsetY + 5.5 + li * 6);
      li++;
    });
  }

  const filename = `laadplan-${vehicle.name.toLowerCase().replace(/[\s,]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;

  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
