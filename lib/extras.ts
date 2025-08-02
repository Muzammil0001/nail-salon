import otpGenerator from "otp-generator";
import prisma from "./prisma";
import { logToFile } from "../utils/logHelper";
export const generateOtp = (length: number) => {
  return otpGenerator.generate(length, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
};

export const getEnvKey = async (key: string) => {
  try {
    const data = await prisma.configuration.findUnique({
      where: {
        key,
      },
    });
    return data?.value;
  } catch (error) {
    logToFile(error as any);
  }
};

export const generateRandomColor = () => {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
};

export const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  };

  const startFormatted = start.toLocaleDateString("en-US", options);
  const endFormatted = end.toLocaleDateString("en-US", options);

  return `${startFormatted} - ${endFormatted}`;
};
