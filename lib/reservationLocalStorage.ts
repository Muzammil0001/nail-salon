// utils/localStorage.ts
export const loadReservationState = () => {
  try {
    if (typeof window === "undefined") return undefined;
    const serializedState = localStorage.getItem("reservation");
    return serializedState ? JSON.parse(serializedState) : undefined;
  } catch (e) {
    console.warn("Failed to load reservation from localStorage:", e);
    return undefined;
  }
};

  
export const saveReservationState = (state: any) => {
  try {
    if (typeof window === "undefined") return;
    const serializedState = JSON.stringify(state);
    localStorage.setItem("reservation", serializedState);
  } catch (e) {
    console.warn("Failed to save reservation to localStorage:", e);
  }
};

  