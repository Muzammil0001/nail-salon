export const t = (
  value: string,
  keys: { text: string; translation: string }[]
) => {
  const found =Array.isArray(keys) && keys?.find((k) => k.text === value);
  if (found) {
    return found.translation ? found.translation : value;
  } else {
    return value;
  }
};
