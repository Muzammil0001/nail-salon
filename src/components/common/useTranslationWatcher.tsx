import { useEffect } from "react";
import axios from "axios";
import { useSelector } from "@/store/Store";
import { useSession } from "next-auth/react";
let translationKeys: { text: string; translation: string }[] = [];
const fetchTranslationKeys = async (language_id: string | null) => {
  try {
    const response = await axios.post("/api/app-translation/fetchbypagename", {
      page_name: "api_responses_toaster_messages",
      language_id,
    });
    translationKeys = response.data;
  } catch (error) {
    console.error("Error while fetching translations:", error);
  }
};
export const useTranslationWatcher = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const { data: session }: any = useSession();
  useEffect(() => {
    fetchTranslationKeys(
      session?.user?.language_id ? null : localStorage.getItem("language_id")
    );
  }, [languageUpdate, session]);
};
export const getTranslationKeys = () => translationKeys;
