export const getTime = (inputTime: string): string | null => {
    // --->> Check if the input time is in ISO 8601 format ("2000-01-07T14:30:45.123Z")
    if (inputTime.includes("T")) {
      const timePart = inputTime.split("T")[1].split(".")[0];
      // --->> If the time part exists and is valid, return it
      return timePart || null;
    }
  
    // --->> If the input is not in ISO format, attempt to parse it differently
    const date = new Date(inputTime);
    if (isNaN(date.getTime())) {
      // --->> If the date is invalid, return null
      return null;
    }
  
    // --->> If valid, return the time part in HH:mm:ss format
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  