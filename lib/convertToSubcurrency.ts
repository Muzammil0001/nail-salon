function convertToSubcurrency(amount: any, factor = 100) {
  if (amount == null || isNaN(amount)) {
    return 0;
  }
  return Math.round(Number(amount) * factor);
}

export default convertToSubcurrency;
