import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import TextField from "@mui/material/TextField";
import PageContainer from "@/components/container/PageContainer";
import CustomFormButton from "@/components/forms/theme-elements/CustomFormButton";
import axios from "axios";
import router from "next/router";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import { useSession } from "next-auth/react";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import Loader from "@/components/loader/Loader";
import { t } from "../../../../../lib/translationHelper";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import AvatarEditorDialog from "@/components/ImageUpload/AvatarEditor";
import CustomFileUpload from "@/components/forms/theme-elements/CustomFileUpload";
import { useSelector } from "@/store/Store";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import CustomSwitch from "@/components/switches/CustomSwitch";
import AccessDenied from "@/components/NoAccessPage";
import { checkAccess } from "../../../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";

const SectionForm: React.FC = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [actions, setActions] = useState<any>("create");
  const { id, action } = router.query;
  const [loading, setLoading] = useState(false);
  const [isSaveAndContinue, setIsSaveAndContinue] = useState<boolean>(false);
  const [image, setImage] = useState("");
  const { data: session }: any = useSession();

  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "category" }
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
          const response = await axios.post("/api/category/getsinglecategory", {
            category_id: id,
          });

          if (response.status === 200 && response.data.category) {
            const category = response.data.category;
            setImage(category?.image)
            formik.setValues({
              name: category.name || "",
              description: category.description ?? "",
              active_status: category.active_status ?? false,
              image:category?.image,
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
      name: "",
      description: "",
      active_status: false,
      image:""
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required("category_name_is_required")
        .min(2, "must_be_at_least_2_characters")
        .max(50, "must_be_50_characters_or_less"),

      description: Yup.string().required("description_is_required"),
    }),
    onSubmit: async (values) => {
      try {
        const endpoint =
          action === "view"
            ? "/api/category/updatecategory"
            : "/api/category/createcategory";

        const payload =
          actions === "view"
            ? {
              category_id: id,
              name: values.name,
              description: values.description,
              active_status: values.active_status,
              image,
            }
            : {
              name: values.name,
              description: values.description,
              active_status: values.active_status,
              image,
            };

        const response = await axios.post(endpoint, payload);

        if (response.status === 201 || response.status === 200) {
          ToastSuccessMessage(response.data?.message || "saved!");
          if (isSaveAndContinue) {
            formik.resetForm();
            setImage("");
          } else {
            router.push("/admin/categories");
          }
        }
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
  });

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
   {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/categories")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            session.user.accessrights?.controls as AccessRights2,
            "/admin/categories",
            action === "create" ? "add" : "edit"
          ))) ? ( <PageContainer topbar={<div></div>}>
      <Loader loading={loading} />

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div>
          <CustomFormLabel required> {t("name", keys)}</CustomFormLabel>
          <CustomTextField
            name="name"
            placeholder={t("type_here", keys)}
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
          <textarea
            id="description"
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={t("type_here", keys)}
            className="w-full lg:w-[30%] min-h-[120px] p-2 border placeholder:text-sm placeholder:text-[#666666] border-gray-300 rounded-md resize-y text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          {formik.touched?.description && formik.errors?.description && (
            <p className="text-red-500 text-sm mt-1">
              {t(formik.errors.description as string, keys)}
            </p>
          )}
        </div>
        <div
        className="flex flex-col md:w-[40%] w-full"
        >
          <CustomFormLabel sx={{ color: "#666666", m:"0px" }}>
            {t("active", keys)}
          </CustomFormLabel>
          <div className="flex items-center gap-4">
            <CustomSwitch
              onBlur={formik.handleBlur}
              edge="end"
              onChange={(e:any) => {
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

         <Grid container>
          <Grid item xs={12} md={6} xl={4}>
            <AvatarEditorDialog
              initialLogo={formik.values.image}
              image={image}
              setImage={setImage}
              placeholder={t("image", keys)}
            />
          </Grid>
        </Grid> 

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
    </PageContainer>):(<AccessDenied/>)}
   </>
  );
};

export default SectionForm;
