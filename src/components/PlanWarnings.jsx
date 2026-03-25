export default function PlanWarnings({ warnings }) {
  return (
    <div className="min-w-[260px] rounded-lg border bg-slate-50 p-3">
      <div className="mb-2 text-sm font-semibold text-slate-900">Waarschuwingen</div>
      {warnings.length === 0 ? (
        <div className="text-sm text-slate-600">Geen waarschuwingen.</div>
      ) : (
        <ul className="space-y-2 text-sm text-slate-700">
          {warnings.map((warning, index) => (
            <li key={index} className="rounded border bg-white p-2">{warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
