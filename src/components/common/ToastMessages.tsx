import { toast } from "sonner";
import { IconX } from "@tabler/icons-react";
import { t } from "../../../lib/translationHelper";
import { getTranslationKeys } from "./useTranslationWatcher";

const cancelButton = {
  label: <IconX className="size-5 p-0 m-0 text-black cursor-pointer" />,
  onClick: () => {},
};

export const ToastSuccessMessage = (message: string, text?: string) => {
  if (!message) return;
  const translationKeys = getTranslationKeys();
  let translated = t(message, translationKeys);
  if (text) translated += ` - ${text}`;
  toast.success(translated, { cancel: cancelButton });
};

export const ToastErrorMessage = (error: any) => {
  if (!error) return;
  const translationKeys = getTranslationKeys();
  let errorMessage = t("an_unknown_error_occurred", translationKeys);
  let rawText: string | undefined;

  if (typeof error === "string") {
    errorMessage = t(error, translationKeys) || errorMessage;
  } else if (typeof error === "object" && error !== null) {
    const responseError = error as {
      response?: { data?: { message?: string; error?: string; text?: string } };
    };

    const data = responseError.response?.data;
    rawText = data?.text;
    console.log(data, "data");
    errorMessage =
      t(data?.message as string, translationKeys) ||
      t(data?.error as string, translationKeys) ||
      errorMessage;
  }

  if (rawText) {
    errorMessage += ` - ${rawText}`;
  }

  toast.error(errorMessage, { cancel: cancelButton });
};
