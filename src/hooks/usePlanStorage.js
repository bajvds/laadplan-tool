import { useLocalStorage } from "./useLocalStorage";

export function usePlanStorage() {
  const [savedPlans, setSavedPlans] = useLocalStorage("laadplan-savedPlans", []);

  const savePlan = (name, lines, vehicleKey) => {
    const plan = {
      id: crypto.randomUUID(),
      name,
      lines,
      vehicleKey,
      savedAt: new Date().toISOString(),
    };
    setSavedPlans((prev) => [plan, ...prev]);
    return plan;
  };

  const loadPlan = (id) => savedPlans.find((p) => p.id === id);

  const deletePlan = (id) => setSavedPlans((prev) => prev.filter((p) => p.id !== id));

  return { savedPlans, savePlan, loadPlan, deletePlan };
}
