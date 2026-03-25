import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RotateCcw } from "lucide-react";
import { VEHICLES } from "@/data/vehicles";
import { COLORS } from "@/data/defaults";
import { parsePastedRows } from "@/utils/helpers";
import { makeFloorLoadPlan } from "@/algorithm";
import { exportPlanAsPdf } from "@/utils/exportPdf";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePlanStorage } from "@/hooks/usePlanStorage";
import { useDraggablePlan } from "@/hooks/useDraggablePlan";
import VehicleVisual from "./VehicleVisual";
import CargoInputTable from "./CargoInputTable";
import PlanSummary from "./PlanSummary";
import PlanWarnings from "./PlanWarnings";
import SavedPlans from "./SavedPlans";

function ensureLineIds(lines) {
  return lines.map((line) => (line.id ? line : { ...line, id: crypto.randomUUID() }));
}

const defaultLines = [
  { id: crypto.randomUUID(), description: "Euro pallet", length: 120, width: 80, weight: 650, qty: 8, color: COLORS[0] },
  { id: crypto.randomUUID(), description: "Blokpallet", length: 120, width: 100, weight: 900, qty: 2, color: COLORS[1] },
];

export default function LaadplanApp() {
  const [vehicleKey, setVehicleKey] = useLocalStorage("laadplan-vehicleKey", "trailer136");
  const [lines, setLines] = useLocalStorage("laadplan-lines", defaultLines);
  const [pasteValue, setPasteValue] = useState("");
  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);
  const [isManuallyAdjusted, setIsManuallyAdjusted] = useState(false);

  // Ensure all lines have IDs (migration from old localStorage data)
  useEffect(() => {
    const migrated = ensureLineIds(lines);
    if (migrated.some((line, i) => line.id !== lines[i]?.id)) {
      setLines(migrated);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const vehicle = VEHICLES[vehicleKey];
  const visualRef = useRef(null);

  // Plan state: algorithm-generated, manually adjustable
  const [plan, setPlan] = useState(() => makeFloorLoadPlan(lines, vehicle));

  useEffect(() => {
    setPlan(makeFloorLoadPlan(lines, vehicle));
    setIsManuallyAdjusted(false);
  }, [lines, vehicle]);

  const scale = Math.min(900 / vehicle.length, 280 / vehicle.width);
  const { dragState, dragHandlers } = useDraggablePlan(plan, setPlan, vehicle, scale, setIsManuallyAdjusted);

  // Saved plans
  const { savedPlans, savePlan, loadPlan, deletePlan } = usePlanStorage();

  const handleSavePlan = (name) => {
    savePlan(name, lines, vehicleKey);
  };

  const handleLoadPlan = (id) => {
    const saved = loadPlan(id);
    if (saved) {
      setVehicleKey(saved.vehicleKey);
      setLines(ensureLineIds(saved.lines));
    }
  };

  const handlePasteImport = () => {
    const parsed = parsePastedRows(pasteValue);
    if (parsed.length > 0) {
      setLines(parsed);
      setPasteValue("");
    }
  };

  const handleExportPdf = async () => {
    const prevHovered = hoveredLineIndex;
    setHoveredLineIndex(null);
    // Wait for re-render before capturing
    await new Promise((r) => setTimeout(r, 50));
    await exportPlanAsPdf(visualRef.current, plan, vehicle);
    setHoveredLineIndex(prevHovered);
  };

  const handleResetPlan = () => {
    setPlan(makeFloorLoadPlan(lines, vehicle));
    setIsManuallyAdjusted(false);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 p-6"
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={dragHandlers.onPointerUp}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laadplan Tool</h1>
          <p className="mt-2 text-sm text-slate-600">Compacte planner met hover-koppeling, maatvoering en LDM per regel.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Invoer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full space-y-2">
                <Label>Voertuig</Label>
                <Select value={vehicleKey} onValueChange={setVehicleKey}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VEHICLES).map(([key, v]) => (
                      <SelectItem key={key} value={key}>{`${v.name} (${v.length} x ${v.width} cm)`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="rounded border p-3 text-sm text-slate-600">
                  Laadruimte: {vehicle.length} x {vehicle.width} cm &middot; Max gewicht: {vehicle.maxWeight} kg
                </div>
              </div>

              <SavedPlans
                savedPlans={savedPlans}
                onSave={handleSavePlan}
                onLoad={handleLoadPlan}
                onDelete={deletePlan}
              />

              <div className="rounded border p-3">
                <div className="mb-2 text-sm font-medium">Plakken vanuit Excel (omschrijving, lengte, breedte, kg, aantal)</div>
                <textarea
                  className="h-28 w-full rounded border p-2 text-sm"
                  value={pasteValue}
                  placeholder={"Euro pallet\t120\t80\t650\t10\nBlokpallet\t120\t100\t900\t2"}
                  onChange={(e) => setPasteValue(e.target.value)}
                  onBlur={handlePasteImport}
                />
              </div>

              <CargoInputTable lines={lines} setLines={setLines} hoveredLineIndex={hoveredLineIndex} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultaat</CardTitle>
            </CardHeader>
            <CardContent>
              <PlanSummary plan={plan} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle>Laadplan</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={handleExportPdf}>
                  <Download className="h-4 w-4" /> PDF
                </Button>
                {isManuallyAdjusted && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={handleResetPlan}>
                    <RotateCcw className="h-4 w-4" /> Herberekenen
                  </Button>
                )}
              </div>
              <PlanWarnings warnings={plan.warnings} />
            </div>
          </CardHeader>
          <CardContent>
            <VehicleVisual
              ref={visualRef}
              vehicle={vehicle}
              plan={plan}
              hoveredLineIndex={hoveredLineIndex}
              setHoveredLineIndex={setHoveredLineIndex}
              dragHandlers={dragHandlers}
              dragState={dragState}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
