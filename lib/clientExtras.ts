import { AccessRights2 } from "@/types/admin/types";
import moment from "moment";

export const checkAccess = (
  accessrights: AccessRights2,
  href: string,
  accessName: "view" | "add" | "edit" | "delete"
): boolean => {
  const accessRight = accessrights?.links
    .flatMap((link) => link?.items)
    .find((item) => item?.href === href);

  return accessRight ? accessRight[accessName] === true : false;
};

export const checkAvailability = (schedules: any, timezone: string) => {
  const adjustedSchedules = schedules?.map((sch: any) => {
    const scheduleFrom = moment.utc(sch.schedule_from).tz(timezone);
    const scheduleTo = moment.utc(sch.schedule_to).tz(timezone);
    scheduleFrom.set({
      year: moment().year(),
      month: moment().month(),
      date: moment().date(),
    });
    scheduleTo.set({
      year: moment().year(),
      month: moment().month(),
      date: moment().date(),
    });
    if (scheduleTo.isBefore(scheduleFrom)) {
      scheduleTo.add(1, "day");
    }
    return {
      ...sch,
      schedule_from: scheduleFrom,
      schedule_to: scheduleTo,
    };
  });
  const currentTime = moment.tz(
    `${moment().format("YYYY-MM-DD")} ${moment().format("HH:mm:ss")}`,
    "YYYY-MM-DD HH:mm:ss",
    timezone
  );
  const isOpen = adjustedSchedules?.some((sch: any) =>
    currentTime.isBetween(sch.schedule_from, sch.schedule_to)
  );
  return isOpen;
};
