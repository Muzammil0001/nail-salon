export const formatNumberWithUnit = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
  
    if (isNaN(num)) {
      return 'Invalid number';
    }
  
    const units = ['', 'K', 'M', 'B', 'T'];
    let unitIndex = 0;
    let formattedValue = num;
  
    while (formattedValue >= 1000 && unitIndex < units.length - 1) {
      formattedValue /= 1000;
      unitIndex++;
    }
  
    return `${formattedValue.toFixed(2)}${units[unitIndex]}`;
  };
  
  