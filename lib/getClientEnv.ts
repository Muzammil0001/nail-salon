import axios from "axios";
import currencies from "currency-formatter/currencies.json";
export const getClientEnv = async (key: string) => {
  try {
    const response = await axios.post("/api/env/fetchenvbykey", { key });
    return response.data?.value;
  } catch (error) {
    console.log(error);
  }
};

export const getCurrencySymbol = (currency: string) => {
  return Object.values(currencies).find((cur) => cur.code === currency)?.symbol;
};
