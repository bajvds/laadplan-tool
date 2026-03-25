import { useState, useCallback } from "react";
import { overlaps, recalcStats } from "@/algorithm";

export function useDraggablePlan(plan, setPlan, vehicle, scale, setIsManuallyAdjusted) {
  const [dragState, setDragState] = useState(null);

  const onPointerDown = useCallback((e, item) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    setDragState({
      itemId: item.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startItemX: item.x,
      startItemY: item.y,
      hasOverlap: false,
    });
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragState) return;

    const deltaXPx = e.clientX - dragState.startPointerX;
    const deltaYPx = e.clientY - dragState.startPointerY;
    const newX = Math.round(dragState.startItemX + deltaXPx / scale);
    const newY = Math.round(dragState.startItemY + deltaYPx / scale);

    setPlan((prev) => {
      const draggedItem = prev.placed.find((p) => p.id === dragState.itemId);
      if (!draggedItem) return prev;

      const clampedX = Math.max(0, Math.min(newX, vehicle.length - draggedItem.placedLength));
      const clampedY = Math.max(0, Math.min(newY, vehicle.width - draggedItem.placedWidth));

      const movedItem = { ...draggedItem, x: clampedX, y: clampedY };
      const others = prev.placed.filter((p) => p.id !== dragState.itemId);
      const hasOverlap = others.some((other) => overlaps(movedItem, other));

      setDragState((ds) => ds ? { ...ds, hasOverlap } : null);

      return {
        ...prev,
        placed: others.map((p) => p).concat(movedItem),
      };
    });
  }, [dragState, scale, vehicle, setPlan]);

  const onPointerUp = useCallback(() => {
    if (!dragState) return;

    setPlan((prev) => {
      const draggedItem = prev.placed.find((p) => p.id === dragState.itemId);
      if (!draggedItem) return prev;

      const others = prev.placed.filter((p) => p.id !== dragState.itemId);
      const hasOverlap = others.some((other) => overlaps(draggedItem, other));

      if (hasOverlap) {
        const reverted = { ...draggedItem, x: dragState.startItemX, y: dragState.startItemY };
        const newPlaced = others.concat(reverted);
        return { ...prev, placed: newPlaced };
      }

      setIsManuallyAdjusted(true);
      const stats = recalcStats(prev.placed, vehicle);
      return { ...prev, ...stats };
    });

    setDragState(null);
  }, [dragState, vehicle, setPlan, setIsManuallyAdjusted]);

  return { dragState, dragHandlers: { onPointerDown, onPointerMove, onPointerUp } };
}
