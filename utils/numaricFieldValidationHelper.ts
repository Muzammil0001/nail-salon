export const handleNumericInput = (value:string, decimalPlaces = 2) => {
    const regex = new RegExp(`^\\d*(\\.\\d{0,${decimalPlaces}})?$`);
  
    if (regex.test(value)) {
      return value;
    }
    return null;
  };
  
  export const formatToFixedDecimal = (value: string | number, decimalPlaces: number = 2): string => {
    if (!value || isNaN(Number(value))) return "";
    return parseFloat(String(value)).toFixed(decimalPlaces);
  };
  
  