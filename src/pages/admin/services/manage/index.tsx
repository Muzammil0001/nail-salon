import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import TextField from "@mui/material/TextField";
import PageContainer from "@/components/container/PageContainer";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import CustomFormButton from "@/components/forms/theme-elements/CustomFormButton";
import axios from "axios";
import router from "next/router";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import Loader from "@/components/loader/Loader";
import { useSession } from "next-auth/react";
import { t } from "../../../../../lib/translationHelper";
import {
  Button,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useSelector } from "@/store/Store";
import CustomSelect from "@/components/forms/theme-elements/CustomSelect";
import CustomSwitch from "@/components/switches/CustomSwitch";
import { checkAccess } from "../../../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import AccessDenied from "@/components/NoAccessPage";

const SectionForm: React.FC = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [actions, setActions] = useState<any>("create");
  const { id, action } = router.query;
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState("");
  const [isSaveAndContinue, setIsSaveAndContinue] = useState<boolean>(false);

  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "services_manage" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  useEffect(() => {
    setActions(action);

    if (id) {
      const fetchAllergenData = async () => {
        try {
          setLoading(true);
          const response = await axios.post("/api/services/fetchservice", {
            service_id: id,
          });

          if (response.status === 200) {
            const srv = response.data.service;

            setImage(srv.image);
            formik.setValues({
              name: srv.name || "",
              category_id: srv.category_id,
              duration: srv.duration_minutes,
              price: srv.price,
              descreption: srv.description,
              material_cost: srv.material_cost,
              active_status: srv.active_status ?? false,
            });
          } else {
            console.error(
              "Failed to fetch section data:",

              response.data.message
            );
          }
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      };

      fetchAllergenData();
    }
  }, [id, action]);

  const formik = useFormik({
    initialValues: {
      category_id: 0,
      name: "",
      duration: 0,
      price: 0,
      descreption: "",
      material_cost: 0,
      active_status: false,
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required("service_name_is_required")
        .min(2, "must_be_at_least_2_characters")
        .max(50, "must_be_50_characters_or_less").min(0, "must_be_at_least_0"),
      duration: Yup.number().required("duration_is_required"),
      price: Yup.number().required("price_is_required").min(0, "must_be_at_least_0"),
      material_cost: Yup.number().min(0, "must_be_at_least_0"),
      descreption: Yup.string().required("descreption_is_required"),
    }),
    onSubmit: async (values) => {
      try {
        const endpoint =
          action === "view"
            ? "/api/services/updateservice"
            : "/api/services/createservice";

        const payload =
          actions === "view"
            ? {
              service_id: id,
              name: values.name,
              description: values.descreption,
              category_id: values.category_id,
              price: values.price,
              material_cost: values.material_cost,
              duration_minutes: values.duration,
              active_status: values.active_status,
            }
            : {
              name: values.name,
              description: values.descreption,
              category_id: values.category_id,
              price: values.price,
              material_cost: values.material_cost,
              duration_minutes: values.duration,
              active_status: values.active_status,
            };

        const response = await axios.post(endpoint, payload);

        if (response.status === 201 || response.status === 200) {
          ToastSuccessMessage(response.data?.message || "saved!");

          if (!isSaveAndContinue) {
            router.push("/admin/services");
          } else {
            setImage("");
            formik.resetForm();
          }
        }
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
  });
  const { data: session, status }: any = useSession({
    required: true,
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.post("/api/category/fetchcategories", { fatchAll: true });
        setCategories(response.data.data);
      } catch (error) {
        ToastErrorMessage(error);
      }
    };
    fetchCategories();
  }, []);


  const saveAndContinueHandle = () => {
    try {
      formik.submitForm();
      setIsSaveAndContinue(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/services")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            session.user.accessrights?.controls as AccessRights2,
            "/admin/services",
            action === "create" ? "add" : "edit"
          ))) ? (<PageContainer topbar={<div></div>}>
            <Loader loading={loading} />

            <form onSubmit={formik.handleSubmit} className="space-y-6">
              <div>
                <FormControl fullWidth>
                  <CustomFormLabel required>{t("category", keys)}</CustomFormLabel>
                  <CustomSelect
                    name="category_id"
                    value={formik.values.category_id}
                    onChange={(e: any) => {
                      formik.setFieldValue("category_id", e.target.value);
                    }}
                    onBlur={formik.handleBlur}
                    fullWidth
                    className="w-full md:w-[30%] capitalize border-black"
                    displayEmpty
                    renderValue={(selected: any) =>
                      selected
                        ? categories.find((section) => section.id === selected)
                          ?.name
                        : t("select_category", keys)
                    }
                  >
                    {categories.map((section: any) => (
                      <MenuItem key={section.id} value={section.id} sx={{ textTransform: "capitalize" }}>
                        {section.name}
                      </MenuItem>
                    ))}
                  </CustomSelect>
                  {formik.touched.category_id && formik.errors.category_id ? (
                    <FormHelperText error>{formik.errors.category_id}</FormHelperText>
                  ) : null}
                </FormControl>
              </div>

              <div>
                <CustomFormLabel required> {t("name", keys)}</CustomFormLabel>
                <CustomTextField
                  name="name"
                  placeholder={t("type_here", keys)}
                  variant="outlined"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={
                    formik.touched.name &&
                    formik.errors.name &&
                    t(formik.errors.name, keys)
                  }
                  className="bg-white w-[100%] md:w-[40%] lg:w-[30%]"
                />
              </div>

              <div>
                <CustomFormLabel required> {t("description", keys)}</CustomFormLabel>
                <CustomTextField
                  name="descreption"
                  placeholder={t("type_here", keys)}
                  variant="outlined"
                  value={formik.values.descreption}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.descreption && Boolean(formik.errors.descreption)
                  }
                  helperText={
                    formik.touched.descreption &&
                    formik.errors.descreption &&
                    t(formik.errors.descreption, keys)
                  }
                  className="bg-white w-[100%] md:w-[40%] lg:w-[30%]"
                />
              </div>

              <div>
                <CustomFormLabel required> {t("price", keys)}</CustomFormLabel>
                <CustomTextField
                  name="price"
                  placeholder={t("type_here", keys)}
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.price && Boolean(formik.errors.price)}
                  helperText={
                    formik.touched.price &&
                    formik.errors.price &&
                    t(formik.errors.price, keys)
                  }
                  className="bg-white w-[100%] md:w-[40%] lg:w-[30%]"
                />
              </div>
              <div>
                <CustomFormLabel> {t("material_cost", keys)}</CustomFormLabel>
                <CustomTextField
                  name="material_cost"
                  placeholder={t("type_here", keys)}
                  value={formik.values.material_cost}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.material_cost && Boolean(formik.errors.material_cost)}
                  helperText={
                    formik.touched.material_cost &&
                    formik.errors.material_cost &&
                    t(formik.errors.material_cost, keys)
                  }
                  className="bg-white w-[100%] md:w-[40%] lg:w-[30%]"
                />
              </div>

              <div>
                <CustomFormLabel required> {t("duration_minutes", keys)}</CustomFormLabel>
                <CustomTextField
                  name="duration"
                  placeholder={t("type_here", keys)}
                  variant="outlined"
                  value={formik.values.duration}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.duration && Boolean(formik.errors.duration)}
                  helperText={
                    formik.touched.duration &&
                    formik.errors.duration &&
                    t(formik.errors.duration, keys)
                  }
                  className="bg-white w-[100%] md:w-[40%] lg:w-[30%]"
                />
              </div>
              <div
                className="flex flex-col md:w-[40%] w-full"
              >
                <CustomFormLabel sx={{ color: "#666666", m: "0px" }}>
                  {t("active", keys)}
                </CustomFormLabel>
                <div className="flex items-center gap-4">
                  <CustomSwitch
                    onBlur={formik.handleBlur}
                    edge="end"
                    onChange={(e: any) => {
                      formik.setFieldValue(
                        "active_status",
                        e.target.checked
                      );
                    }}
                    checked={formik.values.active_status}
                  />
                  <Typography sx={{ color: "#666666" }}>
                    {formik.values.active_status
                      ? t("on", keys)
                      : t("off", keys)}
                  </Typography>
                </div>
              </div>
              <div className="text-end">
                <Button
                  sx={{
                    width: "172px",
                    height: "56px",
                    padding: "0px",
                  }}
                  variant="outlined"
                  type="button"
                  hidden={action === "view"}
                  onClick={saveAndContinueHandle}
                >
                  {t("save_and_continue", keys)}
                </Button>

                <CustomFormButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setIsSaveAndContinue(false);
                  }}
                >
                  {actions === "edit" ? t("update", keys) : t("save", keys)}
                </CustomFormButton>
              </div>
            </form>
          </PageContainer>):(<AccessDenied />)}
    </>
  );
};

export default SectionForm;
