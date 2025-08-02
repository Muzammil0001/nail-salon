export const formatTime = (timeString: string): string => {
    return timeString
      ? new Date(`1970-01-01T${timeString}Z`).toISOString()
      : "1970-01-01T00:00:00Z";
  };
  
  /**
   * Checks for overlapping or duplicate time schedules.
   * @param {Array} daySchedules - Array of schedule objects with `schedule_from` and `schedule_to` properties.
   * @returns {boolean} - True if conflicts are found, otherwise false.
   */
  export const checkConflicts = (daySchedules: { schedule_from: string; schedule_to: string }[]): boolean => {
    const sortedSchedules = daySchedules?.sort(
      (a, b) =>
        new Date(a.schedule_from).getTime() - new Date(b.schedule_from).getTime()
    );
  
    for (let i = 1; i < sortedSchedules?.length; i++) {
      const currentStart = new Date(sortedSchedules[i].schedule_from);
      const previousEnd = new Date(sortedSchedules[i - 1].schedule_to);
  
      if (currentStart < previousEnd) {
        return true; // Overlapping schedules
      }
  
      if (
        sortedSchedules[i].schedule_from === sortedSchedules[i - 1].schedule_from &&
        sortedSchedules[i].schedule_to === sortedSchedules[i - 1].schedule_to
      ) {
        return true; // Duplicate schedules
      }
    }
  
    return false;
  };
  