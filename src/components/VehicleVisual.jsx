import React from "react";

const VehicleVisual = React.forwardRef(function VehicleVisual({ vehicle, plan, hoveredLineIndex, setHoveredLineIndex, dragHandlers, dragState }, ref) {
  if (!vehicle) return null;

  const scale = Math.min(900 / vehicle.length, 280 / vehicle.width);
  const floorWidth = vehicle.length * scale;
  const floorHeight = vehicle.width * scale;
  const tickStep = Math.max(100, Math.round(vehicle.length / 6 / 10) * 10);
  const lengthTicks = [];
  for (let tick = 0; tick <= vehicle.length; tick += tickStep) lengthTicks.push(tick);
  if (lengthTicks[lengthTicks.length - 1] !== vehicle.length) lengthTicks.push(vehicle.length);
  const widthTicks = [0, Math.round(vehicle.width / 2), vehicle.width];

  return (
    <div ref={ref} className="rounded-xl border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Laadplan vloer</div>
          <div className="text-sm text-slate-600">{vehicle.name} &middot; {vehicle.length} x {vehicle.width} cm</div>
        </div>
        <div className="text-right text-sm text-slate-600">
          <div>Benutte lengte: {plan.usedLength} cm</div>
          <div>Vloerbenutting: {plan.footprintUtilization}%</div>
          <div>Laadmeters: {plan.ldm} LDM</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width: floorWidth + 56, height: floorHeight + 52 }}>
          <div className="absolute left-12 top-0 h-6 text-[10px] text-slate-500" style={{ width: floorWidth }}>
            {lengthTicks.map((tick) => (
              <div key={`top-${tick}`} className="absolute -translate-x-1/2" style={{ left: (tick / vehicle.length) * floorWidth }}>
                {tick}
              </div>
            ))}
          </div>

          <div className="absolute left-0 top-6 w-10 text-[10px] text-slate-500" style={{ height: floorHeight }}>
            {widthTicks.map((tick) => (
              <div key={`side-${tick}`} className="absolute -translate-y-1/2" style={{ top: (tick / vehicle.width) * floorHeight, right: 0 }}>
                {tick}
              </div>
            ))}
          </div>

          <div className="absolute left-12 top-6 border-2 border-slate-300 bg-slate-50" style={{ width: floorWidth, height: floorHeight }}>
            {lengthTicks.map((tick) => (
              <div key={`grid-x-${tick}`} className="absolute top-0 h-full border-l border-dashed border-slate-200" style={{ left: (tick / vehicle.length) * floorWidth }} />
            ))}
            {widthTicks.map((tick) => (
              <div key={`grid-y-${tick}`} className="absolute left-0 w-full border-t border-dashed border-slate-200" style={{ top: (tick / vehicle.width) * floorHeight }} />
            ))}

            {plan.placed.map((item) => {
              const isDragging = dragState?.itemId === item.id;
              const hasOverlap = isDragging && dragState?.hasOverlap;

              return (
                <div
                  key={item.id}
                  className={`absolute overflow-hidden border transition-colors select-none
                    ${isDragging ? "cursor-grabbing z-20 ring-2 ring-blue-500" : "cursor-grab"}
                    ${hasOverlap ? "border-red-500 ring-2 ring-red-400" : ""}
                    ${!isDragging && hoveredLineIndex === item.lineIndex ? "border-slate-900 ring-2 ring-slate-900/30 z-10" : ""}
                    ${!isDragging && !hasOverlap && hoveredLineIndex !== item.lineIndex ? "border-slate-700" : ""}`}
                  style={{
                    left: (item.x / vehicle.length) * floorWidth,
                    top: (item.y / vehicle.width) * floorHeight,
                    width: (item.placedLength / vehicle.length) * floorWidth,
                    height: (item.placedWidth / vehicle.width) * floorHeight,
                    backgroundColor: hasOverlap ? "#fecaca" : item.color,
                  }}
                  title={`${item.description} | ${item.placedLength} x ${item.placedWidth} cm`}
                  onPointerDown={dragHandlers ? (e) => dragHandlers.onPointerDown(e, item) : undefined}
                  onMouseEnter={() => !dragState && setHoveredLineIndex(item.lineIndex)}
                  onMouseLeave={() => !dragState && setHoveredLineIndex(null)}
                >
                  <div className="flex h-full items-center justify-center px-1 text-center text-[10px] font-medium text-slate-800">
                    <div>
                      <div>{item.description}</div>
                      <div>#{item.sequence}</div>
                      <div>{item.placedLength} x {item.placedWidth}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {plan.unplaced.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <div className="mb-2 text-sm font-semibold text-rose-900">Niet passend</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.unplaced.map((item) => (
              <div
                key={`unplaced-${item.id}`}
                className={`rounded border p-2 text-xs ${hoveredLineIndex === item.lineIndex ? "border-rose-500 bg-rose-100" : "border-rose-300"}`}
                onMouseEnter={() => setHoveredLineIndex(item.lineIndex)}
                onMouseLeave={() => setHoveredLineIndex(null)}
              >
                <div className="font-semibold">{item.description}</div>
                <div>#{item.sequence}</div>
                <div>{item.length} x {item.width} cm</div>
                <div>{item.weight} kg</div>
                <div className="text-rose-700">{item.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default VehicleVisual;
