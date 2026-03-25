import * as XLSX from "xlsx";

const HEADERS = ["Omschrijving", "Lengte (cm)", "Breedte (cm)", "Gewicht (kg)", "Aantal"];

const EXAMPLE_ROWS = [
  ["Euro pallet", 120, 80, 650, 8],
  ["Blokpallet", 120, 100, 900, 2],
];

export function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...EXAMPLE_ROWS]);

  // Column widths
  ws["!cols"] = [
    { wch: 20 }, // Omschrijving
    { wch: 12 }, // Lengte
    { wch: 12 }, // Breedte
    { wch: 12 }, // Gewicht
    { wch: 10 }, // Aantal
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laadplan");
  XLSX.writeFile(wb, "laadplan-template.xlsx");
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Skip header row, parse data rows
        const dataRows = rows.slice(1).filter((row) => row.length >= 5 && row[0]);
        resolve(dataRows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Bestand kon niet gelezen worden"));
    reader.readAsArrayBuffer(file);
  });
}
