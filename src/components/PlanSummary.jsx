export default function PlanSummary({ plan }) {
  const weightPct = plan.totalWeight > 0 ? Math.round((plan.placedWeight / plan.totalWeight) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Gewicht</span>
          <span className="font-medium">{plan.placedWeight} / {plan.totalWeight} kg</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(weightPct, 100)}%` }} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Vloerbenutting</span>
          <span className="font-medium">{plan.footprintUtilization}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(plan.footprintUtilization, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">Benutte lengte</div>
          <div className="text-lg font-semibold">{plan.usedLength} <span className="text-sm font-normal text-slate-400">cm</span></div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">Laadmeters</div>
          <div className="text-lg font-semibold">{plan.ldm} <span className="text-sm font-normal text-slate-400">LDM</span></div>
        </div>
      </div>

      <div className="flex justify-between border-t pt-2 text-xs text-slate-500">
        <span>Geplaatst: {plan.placed.length} stuks</span>
        {plan.unplaced.length > 0 && <span className="text-rose-500">Niet passend: {plan.unplaced.length}</span>}
      </div>
    </div>
  );
}
