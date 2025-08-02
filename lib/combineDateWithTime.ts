export function combineDateWithTime(dateStr: string, timeInput: string): Date {

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(timeInput)) {
    const parsed = new Date(timeInput);
    return isNaN(parsed.getTime()) ? new Date("Invalid Date") : parsed;
  }

  if (dateStr.includes("T")) {
    const split = dateStr.split("T");
    if (split.length > 1) {
      dateStr = split[0];
    }
  }

  const [hoursStr, minutesStr] = timeInput.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (
    isNaN(hours) || hours < 0 || hours > 23 ||
    isNaN(minutes) || minutes < 0 || minutes > 59
  ) {
    return new Date("Invalid Date");
  }

  let finalDate: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const isoString = `${dateStr}T${hoursStr.padStart(2, "0")}:${minutesStr.padStart(2, "0")}:00Z`;
    finalDate = new Date(isoString);
  } else {
    const date = new Date(`${dateStr}T00:00:00`);
    if (isNaN(date.getTime())) return new Date("Invalid Date");
    date.setHours(hours, minutes, 0, 0);
    finalDate = date;
  }

  return isNaN(finalDate.getTime()) ? new Date("Invalid Date") : finalDate;
}
