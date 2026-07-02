import { useState, useEffect, useCallback } from "react";
import {
  loadCorridorEvents,
  appendCorridorEvent,
  type TimeCorridorEvent,
} from "../data/timeCorridor";

export function useTimeCorridor() {
  const [events, setEvents] = useState<TimeCorridorEvent[]>(loadCorridorEvents);

  const refresh = useCallback(() => {
    setEvents(loadCorridorEvents());
  }, []);

  useEffect(() => {
    const onUpdate = () => refresh();
    window.addEventListener("time-corridor-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("time-corridor-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const appendEvent = useCallback(
    (event: Omit<TimeCorridorEvent, "id" | "syncedAt">) => {
      const created = appendCorridorEvent(event);
      refresh();
      return created;
    },
    [refresh]
  );

  return { events, appendEvent, refresh };
}
