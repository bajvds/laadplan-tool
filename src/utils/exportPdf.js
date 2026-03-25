import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportPlanAsPdf(visualElement, plan, vehicle) {
  if (!visualElement) return;

  const canvas = await html2canvas(visualElement, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  pdf.setFontSize(16);
  pdf.text(`Laadplan - ${vehicle.name}`, 14, 15);

  pdf.setFontSize(10);
  pdf.text(new Date().toLocaleDateString("nl-NL"), 14, 22);

  pdf.setFontSize(11);
  const stats = [
    `Voertuig: ${vehicle.name} (${vehicle.length} x ${vehicle.width} cm)`,
    `Totaal gewicht: ${plan.totalWeight} kg  |  Geplaatst: ${plan.placedWeight} kg`,
    `Benutte lengte: ${plan.usedLength} cm  |  Vloerbenutting: ${plan.footprintUtilization}%`,
    `Laadmeters: ${plan.ldm} LDM`,
  ];
  stats.forEach((line, i) => pdf.text(line, 14, 30 + i * 6));

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 270;
  const imgHeight = (canvas.height / canvas.width) * imgWidth;
  pdf.addImage(imgData, "PNG", 14, 58, imgWidth, Math.min(imgHeight, 130));

  if (plan.warnings.length > 0) {
    const yStart = 58 + Math.min(imgHeight, 130) + 8;
    pdf.setFontSize(11);
    pdf.text("Waarschuwingen:", 14, yStart);
    pdf.setFontSize(10);
    plan.warnings.forEach((w, i) => pdf.text(`- ${w}`, 18, yStart + 6 + i * 5));
  }

  const filename = `laadplan-${vehicle.name.toLowerCase().replace(/[\s,]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}
