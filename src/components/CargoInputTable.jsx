import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { COLORS } from "@/data/defaults";
import { calculateLineLdm } from "@/utils/helpers";

function SortableRow({ id, children, isHighlighted }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isHighlighted ? "bg-amber-50 ring-1 ring-amber-300" : ""} {...attributes}>
      <TableCell className="w-8 px-1">
        <button {...listeners} className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

export default function CargoInputTable({ lines, setLines, hoveredLineIndex }) {
  const [colWidths, setColWidths] = useState({ desc: 220, num: 90 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const startResize = (key, startX) => {
    const startWidth = colWidths[key];
    const onMouseMove = (e) => {
      const delta = e.clientX - startX;
      setColWidths((prev) => ({ ...prev, [key]: Math.max(60, startWidth + delta) }));
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        if (["length", "width", "weight", "qty"].includes(field)) {
          return { ...line, [field]: value === "" ? "" : Number(value) };
        }
        return { ...line, [field]: value };
      }),
    );
  };

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "Euro pallet",
        length: 120,
        width: 80,
        weight: 500,
        qty: 1,
        color: COLORS[prev.length % COLORS.length],
      },
    ]);

  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setLines((prev) => {
        const oldIndex = prev.findIndex((l) => l.id === active.id);
        const newIndex = prev.findIndex((l) => l.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 px-1"></TableHead>
                <TableHead>Kleur</TableHead>
                <TableHead style={{ width: colWidths.desc }} className="relative">
                  Omschrijving
                  <div onMouseDown={(e) => startResize("desc", e.clientX)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize" />
                </TableHead>
                <TableHead style={{ width: colWidths.num }} className="relative">
                  L
                  <div onMouseDown={(e) => startResize("num", e.clientX)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize" />
                </TableHead>
                <TableHead style={{ width: colWidths.num }}>B</TableHead>
                <TableHead style={{ width: colWidths.num }}>Kg</TableHead>
                <TableHead style={{ width: colWidths.num }}>Aantal</TableHead>
                <TableHead style={{ width: colWidths.num }}>LDM</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext items={lines.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {lines.map((line, index) => (
                  <SortableRow key={line.id} id={line.id} isHighlighted={hoveredLineIndex === index}>
                    <TableCell>
                      <input type="color" value={line.color || COLORS[index % COLORS.length]} onChange={(e) => updateLine(index, "color", e.target.value)} className="h-10 w-14 cursor-pointer rounded border bg-transparent p-1" />
                    </TableCell>
                    <TableCell style={{ width: colWidths.desc }}>
                      <Input style={{ width: colWidths.desc }} value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} />
                    </TableCell>
                    <TableCell><Input type="number" className="bg-white text-center text-black" style={{ width: colWidths.num }} value={line.length} onChange={(e) => updateLine(index, "length", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" className="bg-white text-center text-black" style={{ width: colWidths.num }} value={line.width} onChange={(e) => updateLine(index, "width", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" className="bg-white text-center text-black" style={{ width: colWidths.num }} value={line.weight} onChange={(e) => updateLine(index, "weight", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" className="bg-white text-center text-black" style={{ width: colWidths.num }} value={line.qty} onChange={(e) => updateLine(index, "qty", e.target.value)} /></TableCell>
                    <TableCell className="text-center text-sm text-slate-600">{calculateLineLdm(line).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeLine(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </SortableRow>
                ))}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </div>

      <Button onClick={addLine} className="gap-2"><Plus className="h-4 w-4" /> Regel toevoegen</Button>
    </div>
  );
}
