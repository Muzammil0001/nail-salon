import { DEFAULT_SCHEDULE_DAYS } from "@/constants";
import { getTime } from "./getTime";

export const getScheduleForDays = (scheduleData: any) => {
  return DEFAULT_SCHEDULE_DAYS?.map((day) => {
    const schedule = scheduleData?.find(
      (schedule: { id: string }) => schedule.id?.toLowerCase().trim() === day.id?.toLowerCase().trim()
    );

    const timeSlots = schedule
      ? schedule?.timeSlots?.map((slot: any) => ({
          schedule_from: getTime(slot.schedule_from),
          schedule_to: getTime(slot.schedule_to),
          schedule_enabled: slot.schedule_enabled ?? slot.active_status ?? false,
          isNew: false,
        }))
      : day.timeSlots;

    return {
      ...day,
      timeSlots,
    };
  });
};

