import { useState, useEffect } from "react";
import { useFormik } from "formik";
import axios from "axios";
import * as Yup from "yup";
import {
  MenuItem,
  Select,
  FormControl,
  TextField,
  FormHelperText,
} from "@mui/material";
import PageContainer from "@/components/container/PageContainer";
import CustomFormButton from "@/components/forms/theme-elements/CustomFormButton";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import { useRouter } from "next/router";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "@/components/common/ToastMessages";
import Loader from "@/components/loader/Loader";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { t } from "../../../../../lib/translationHelper";
import { useSelector } from "@/store/Store";
interface AppName {
  id: number;
  app_name: string;
}

const MyForm = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [applications, setApplications] = useState<AppName[]>([]);
  const [loading, setLoading] = useState(false);
  const [modifierData, setModifierData] = useState<any>(null);
  const router = useRouter();
  const { id, action } = router.query;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.post("/api/appversions/getappname");
        setApplications(response.data.app_names);
      } catch (error) {
        ToastErrorMessage(error);
      }
    };
    fetchApplications();

    if (action === "view" && id) {
      const fetchModifierData = async (id: string) => {
        try {
          setLoading(true);

          const response = await axios.post("/api/appversions/singleversion", {
            id,
          });
          const data = response.data;

          if (response.status === 200) {
            setModifierData(data.appVersion);
            formik.setValues(data.appVersion);
          } else {
            console.error("Failed to fetch modifier data:", data.message);
          }
        } catch (error) {
          console.error("Error fetching modifier data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchModifierData(id as string);
    }
  }, [id, action]);

  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "appversion" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const formik = useFormik({
    initialValues: {
      app_id: null,
      app_platform: "",
      app_version_number: "",
      app_version_build_number: "",
      app_version_optional: true,
      app_version_live: false,
    },
    validationSchema: Yup.object({
      app_id: Yup.string().required("application_is_required"),
      app_platform: Yup.string().required("platform_is_required"),
      app_version_build_number: Yup.string().required(
        "build_number_is_required"
      ),
      app_version_number: Yup.string().required("version_number_is_required"),
      app_version_live: Yup.boolean().required("version_live_is_required"),
    }),
    onSubmit: async (values) => {
      const formData = {
        id,
        app_id: values.app_id,
        app_platform: values.app_platform,
        app_version_number: values.app_version_number,
        app_version_build_number: values.app_version_build_number,
        app_version_optional: values.app_version_optional,
        app_version_live: values.app_version_live,
      };

      if (action === "create") {
        setLoading(true);
        try {
          const response = await axios.post(
            "/api/appversions/createversion",
            formData
          );
          ToastSuccessMessage(response?.data?.message || "created!");
          router.push("/admin/appversions");
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      } else if (action === "view" && id) {
        try {
          setLoading(true);
          const response = await axios.post(
            "/api/appversions/updateversion",
            formData
          );
          ToastSuccessMessage(response?.data?.message || "updated!");
          router.push("/admin/appversions");
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      }
    },
  });
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/appversions")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <PageContainer topbar={<div></div>}>
      <Loader loading={loading} />
      <form onSubmit={formik.handleSubmit}>
        <div>
          <FormControl fullWidth>
            <CustomFormLabel required>{t("application", keys)}</CustomFormLabel>
            <Select
              name="app_id"
              value={formik.values.app_id}
              onChange={(e) => {
                formik.setFieldValue("app_id", e.target.value);
              }}
              onBlur={formik.handleBlur}
              fullWidth
              className="w-[50%] capitalize"
              displayEmpty
              renderValue={(selected: any) =>
                selected
                  ? applications.find((app) => app.id === selected)?.app_name
                  : t("select_application", keys)
              }
            >
              <MenuItem value="" disabled>
                {t("select_application", keys)}
              </MenuItem>
              {applications.map((app) => (
                <MenuItem key={app.id} value={app.id}>
                  {app.app_name}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.app_id && formik.errors.app_id ? (
              <FormHelperText error>
                {t(formik.errors.app_id, keys)}
              </FormHelperText>
            ) : null}
          </FormControl>
        </div>

        <div>
          <FormControl fullWidth>
            <CustomFormLabel required>{t("platform", keys)}</CustomFormLabel>
            <Select
              labelId="app_platform"
              id="app_platform"
              name="app_platform"
              value={formik.values.app_platform}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-[50%] ${
                !formik.values.app_platform ? "capitalize" : "uppercase"
              }`}
              displayEmpty
            >
              <MenuItem value="" disabled>
                {t("select_platform", keys)}
              </MenuItem>
              {["ios", "windows", "android"].map(
                (item: string, idx: number) => (
                  <MenuItem
                    key={idx}
                    value={item}
                    sx={{ textTransform: "uppercase" }}
                  >
                    {item}
                  </MenuItem>
                )
              )}
            </Select>
            {formik.touched.app_platform && formik.errors.app_platform ? (
              <FormHelperText error>
                {t(formik.errors.app_platform, keys)}
              </FormHelperText>
            ) : null}
          </FormControl>
        </div>
        <div>
          <CustomFormLabel required>
            {t("version_number", keys)}
          </CustomFormLabel>
          <TextField
            id="app_version_number"
            name="app_version_number"
            variant="outlined"
            placeholder={t("type_here", keys)}
            fullWidth
            className="w-[50%]"
            value={formik.values.app_version_number}
            onChange={formik.handleChange}
            error={
              formik.touched.app_version_number &&
              Boolean(formik.errors.app_version_number)
            }
            helperText={
              formik.touched.app_version_number &&
              formik.errors.app_version_number &&
              t(formik.errors.app_version_number, keys)
            }
          />
        </div>

        <div>
          <CustomFormLabel required>{t("build_number", keys)}</CustomFormLabel>
          <TextField
            id="app_version_build_number"
            name="app_version_build_number"
            variant="outlined"
            fullWidth
            placeholder={t("type_here", keys)}
            className="w-[50%]"
            value={formik.values.app_version_build_number}
            onChange={formik.handleChange}
            error={
              formik.touched.app_version_build_number &&
              Boolean(formik.errors.app_version_build_number)
            }
            helperText={
              formik.touched.app_version_build_number &&
              formik.errors.app_version_build_number &&
              t(formik.errors.app_version_build_number, keys)
            }
          />
        </div>

        <div>
          <FormControl fullWidth>
            <CustomFormLabel>{t("optional", keys)}</CustomFormLabel>
            <Select
              id="app_version_optional"
              name="app_version_optional"
              className="w-[50%]"
              value={formik.values.app_version_optional ? "yes" : "no"}
              onChange={(e) =>
                formik.setFieldValue(
                  "app_version_optional",
                  e.target.value === "yes"
                )
              }
            >
              <MenuItem value="yes">{t("yes", keys)}</MenuItem>
              <MenuItem value="no">{t("no", keys)}</MenuItem>
            </Select>
            {formik.touched.app_version_optional &&
            formik.errors.app_version_optional ? (
              <FormHelperText error>
                {t(formik.errors.app_version_optional, keys)}
              </FormHelperText>
            ) : null}
          </FormControl>
        </div>

        <div>
          <FormControl fullWidth>
            <CustomFormLabel>{t("version_live", keys)}</CustomFormLabel>
            <Select
              id="app_version_live"
              name="app_version_live"
              className="w-[50%]"
              value={formik.values.app_version_live ? "yes" : "no"}
              onChange={(e) =>
                formik.setFieldValue(
                  "app_version_live",
                  e.target.value === "yes"
                )
              }
            >
              <MenuItem value="yes">{t("yes", keys)}</MenuItem>
              <MenuItem value="no">{t("no", keys)}</MenuItem>
            </Select>
            {formik.touched.app_version_live &&
            formik.errors.app_version_live ? (
              <FormHelperText error>
                {t(formik.errors.app_version_live, keys)}
              </FormHelperText>
            ) : null}
          </FormControl>
        </div>

        <div className="flex justify-end mt-6">
          <CustomFormButton type="submit" variant="contained" color="primary">
            {t("save", keys)}
          </CustomFormButton>
        </div>
      </form>
    </PageContainer>
  );
};

export default MyForm;
