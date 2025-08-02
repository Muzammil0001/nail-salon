import { useEffect, useState } from "react";
import { useFormik } from "formik";
import {
  FormControl,
  MenuItem,
  Select,
  Box,
  Typography,
  Button,
} from "@mui/material";
import Flag from "react-world-flags";
import PageContainer from "@/components/container/PageContainer";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import axios from "axios";
import { useRouter } from "next/router";
import * as yup from "yup";
import { t } from "../../../../../lib/translationHelper"
import { useSelector } from "@/store/Store";
import { translationPages } from "../../../../../lib/pages";
import Loader from "@/components/loader/Loader";
import { useSession } from "next-auth/react";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "@/components/common/ToastMessages";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";

const Index = () => {
  const router = useRouter();
  const [action, setAction] = useState<any>("create");
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<Record<string, any>[]>([]);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "app_translations" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const initialValues = {
    language_id: null,
    translation_page: null,
  };
  const validationSchema = yup.object().shape({
    language_id: yup
      .string()
      .required("language_is_required")
      .test(
        "translation-exists",
       "translation_already_exists",
        async (value, schema) => {
          try {
            const response = await axios.post(
              "/api/app-translation/verifylanguage",
              {
                language_id: value,
                id: schema.parent.id,
                action: action,
              }
            );
            const isExist = response.data;
            return value && isExist;
          } catch (error) {
            ToastErrorMessage(error);
          }
        }
      ),
  });

  const formik = useFormik({
    initialValues: initialValues as any,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      let url = "/api/app-translation/addtranslation";
      try {
        setLoading(true);
        const translationPageTexts = values.translation_page.translation_page_text.map(
          (text: any, index: number) => {
            return {
              ...text,
              translation:
                (document.getElementById(
                  `translation-${index}`
                ) as HTMLInputElement)?.value || "",
            };
          }
        );
        const response = await axios.post(url, {
          ...values,
          translationPageTexts,
        });
        ToastSuccessMessage(response?.data?.message || "saved!");
        router.replace(
          `/app-translation/manage?action=view&id=${response?.data?.id}`
        );
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/app-translation/getlanguages");
        setLanguages(response.data.languages);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (
      router.query.action &&
      router.query.action === "view" &&
      router.query.id
    ) {
      (async () => {
        setAction("view");
        try {
          setLoading(true);
          const response = await axios.post(
            "/api/app-translation/fetchtranslation",
            { id: router.query.id }
          );
          formik.setValues(response.data);
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [router.query]);

  const { data: session, status }: any = useSession({
    required: true,
  });

  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/app-translation")) {
      router.push("/admin/login");
    }
  }, [session]);
  const handlePageChange = async (page: any) => {
    try {
      let updatedPage = page;
      if (action === "view") {
        const response = await axios.post(
          "/api/app-translation/fetchtranslationbypage",
          { id: router.query.id, page_name: page.page_name }
        );
        updatedPage = response.data;
      }

      formik.setFieldValue("translation_page", updatedPage);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      updatedPage.translation_page_text.map((text: any, index: number) => {
        const inputElement = document.getElementById(
          `translation-${index}`
        ) as HTMLInputElement;
        if (inputElement) {
          inputElement.value = text.translation || "";
        }
      });
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer topbar={<></>}>
      <Loader loading={loading} />
      <form encType="multipart/form-data" onSubmit={formik.handleSubmit}>
        <Box>
          <FormControl fullWidth margin="normal">
            <CustomFormLabel>{t("choose_language", keys)}</CustomFormLabel>
            <Select
              disabled={action === "view"}
              name="language_id"
              value={formik.values.language_id}
              onBlur={formik.handleBlur}
              onChange={(e) =>
                formik.setFieldValue("language_id", e.target.value as string)
              }
              className="md:w-[20%]"
            >
              {languages.map((language) => (
                <MenuItem key={language.id} value={language.id}>
                  <Box className="flex gap-2 items-center">
                    <Flag
                      code={language.language_code}
                      style={{ width: 24, height: 16, marginRight: 10 }}
                    />
                    <Typography>{t(language.language_name, keys)}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {formik.touched.language_id && formik.errors.language_id && (
              <Typography color="error">
                {t(formik.errors.language_id as string, keys)}
              </Typography>
            )}
          </FormControl>
        </Box>
        <Typography variant="h5" className="my-6">
          {t("pages", keys)}
        </Typography>
        <Box className="flex gap-4 flex-wrap">
          {translationPages.map((p) => {
            return <>
            <Button
              onClick={() => {
                handlePageChange(p);
              }}
              variant={
                formik.values.translation_page?.page_name === p.page_name
                  ? "contained"
                  : "outlined"
              }
              type="button"
              sx={{ height: "56px" }}
            >
              {t(p.page_name.toLowerCase().trim(), keys)}
            </Button>
          </>})}
        </Box>
        <Typography variant="h5" className="my-6">
          {t("translation", keys)}
        </Typography>
        {formik.values.translation_page && (
          <Box className="space-y-4">
            {formik.values.translation_page.translation_page_text.map(
              (text: any, index2: number) => (
                <Box className="space-y-2" key={index2}>
                  <Typography>{text.text}</Typography>
                  <CustomTextField id={`translation-${index2}`} fullWidth />
                </Box>
              )
            )}
          </Box>
        )}

        <Box className="flex justify-end gap-4 mt-4">
          <Button
            disabled={
              !formik.values.translation_page || !formik.values.language_id
            }
            variant="contained"
            type="submit"
            sx={{ width: "172px", height: "56px", fontSize: "16px" }}
          >
            {action === "create" ? t("save", keys) : t("update", keys)}
          </Button>
        </Box>
      </form>
    </PageContainer>
  );
};

export default Index;
