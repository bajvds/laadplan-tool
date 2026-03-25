import { Button } from "@/components/ui/button";
import { Save, FolderOpen, Trash2 } from "lucide-react";

export default function SavedPlans({ savedPlans, onSave, onLoad, onDelete }) {
  const handleSave = () => {
    const name = window.prompt("Naam voor dit plan:");
    if (name?.trim()) onSave(name.trim());
  };

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Opgeslagen plannen</div>
        <Button variant="outline" size="sm" onClick={handleSave} className="gap-1">
          <Save className="h-3.5 w-3.5" /> Opslaan
        </Button>
      </div>
      {savedPlans.length === 0 ? (
        <div className="text-xs text-slate-500">Nog geen opgeslagen plannen.</div>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {savedPlans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
              <div>
                <div className="font-medium">{plan.name}</div>
                <div className="text-slate-500">{new Date(plan.savedAt).toLocaleDateString("nl-NL")}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLoad(plan.id)}>
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => onDelete(plan.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
