export function hasInvalidTime(days: any[]): boolean {
    return days?.some((day) =>
      day?.timeSlots?.some((slot: any) => {
        const from = new Date(`1970-01-01T${slot.schedule_from}`);
        const to = new Date(`1970-01-01T${slot.schedule_to}`);
  
        return (
          slot.schedule_enabled &&
          (isNaN(from.getTime()) || isNaN(to.getTime()))
        );
      })
    );
  }
  