export default function PlanSummary({ plan }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded border p-4"><div className="text-sm text-slate-500">Totaal gewicht</div><div className="text-xl font-semibold">{plan.totalWeight} kg</div></div>
      <div className="rounded border p-4"><div className="text-sm text-slate-500">Geplaatst gewicht</div><div className="text-xl font-semibold">{plan.placedWeight} kg</div></div>
      <div className="rounded border p-4"><div className="text-sm text-slate-500">Benutte lengte</div><div className="text-xl font-semibold">{plan.usedLength} cm</div></div>
      <div className="rounded border p-4"><div className="text-sm text-slate-500">Laadmeters</div><div className="text-xl font-semibold">{plan.ldm} LDM</div></div>
    </div>
  );
}
