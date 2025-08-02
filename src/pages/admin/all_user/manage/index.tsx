import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import { signOut, useSession } from "next-auth/react";
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
const countryFlagEmoji = require("country-flag-emoji");
const Flag = require("react-world-flags");
import { AlertInterface, Company, LatLng } from "@/types/admin/types";
import PageContainer from "@/components/container/PageContainer";
import Loader from "@/components/loader/Loader";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import * as yup from "yup";
import { useTailwind } from "@/components/providers/TailwindProvider";
import { IconBuilding } from "@tabler/icons-react";

import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { t } from "../../../../../lib/translationHelper";
import { useSelector } from "@/store/Store";

const ManageEmployee = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const defaultLocation = { lat: 45.815, lng: 15.9819 };
  const router = useRouter();
  const { setHeaderContent, setHeaderTitle } = useTailwind();
  const { data: session, status }: any = useSession({
    required: true,
  });
  const [action, setAction] = useState("create");
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "companies_manage" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  
  const validationSchemaUser = yup.object({
    email: yup
    .string()
    .email("enter_a_valid_email")
    .required("email_is_required")
  .test(
      "emp_username-exists",
      "email_already_exists",
      async (value, schema) => {
        try {
          const response = await axios.post(
            "/api/user/verifyuseremail",
            {
              email: value,
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
  confirm_email: yup
    .string()
    .email("enter_a_valid_email")
    .required("email_is_required")
    .test(
      "email-does-not-match",
      "emails_do_not_match",
      (value, schema) => {
        return schema.parent.email === value;
      }
    ),
  username: yup
    .string()
    .min(5, "too_short")
    .max(50, "too_long")
    .required("username_is_required")
    .matches(/^\S*$/, "username_no_spaces")
    .test(
      "emp_username-exists",
      "username_already_exists",
      async (value, schema) => {
        try {
          const response = await axios.post("/api/users/verifyusername", {
            username: value,
            id: schema.parent.id,
            action: action,
          });
          const isExist = response.data;
          return value && isExist;
        } catch (error) {
          ToastErrorMessage(error);
        }
      }
    ),
  first_name: yup
    .string()
    .min(2, "too_short")
    .max(50, "too_long")
    .required("first_name_is_required"),
  last_name: yup
    .string()
    .min(2, "too_short")
    .max(50, "too_long")
    .required("last_name_is_required"),
  password: yup
    .string()
    .min(8, "Password should be of minimum 8 characters length")
    .required("password_is_required"),
  confirm_password: yup
    .string()
    .required("password_is_required")
    .test(
      "password-does-not-match",
      "passwords_do_not_match",
      (value, schema) => {
        return schema.parent.password === value;
      }
    ),
  });


  const fethUser = async (id: string) => {
    try {
      const response = await axios.post("/api/user/getuser", {
        id,
      });
      formik.setValues(response.data);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };
  useEffect(() => {
    if (router.query.action === "view" && router.query.id) {
      setAction("view");
      fethUser(router.query.id as string);
    }

    setHeaderContent(
      <Box className="flex gap-2 items-center">
        <IconBuilding className="text-primary-main" />
        <Typography>
          / Clients /{" "}
          {router.query.action === "create" ? "Add User" : "Edit User"}
        </Typography>
      </Box>
    );
    setHeaderTitle("Users");
  }, [router]);

  const initialValuesData = {
    id: "",
    email: "",
    confirm_email: "",
    username: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    roles: [],
    accessrights: [],
  };
  const formik = useFormik({
    initialValues: initialValuesData,
    validationSchema: validationSchemaUser,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      let url = "/api/clients/createclient";
      if (action == "view") {
        url ="/api/clients/updateclient";
      }
      const manageUser = async () => {
        try {
          setLoading(true);
          const response = await axios.post(url, values);
          if (response.status == 201) {
            ToastSuccessMessage(
              response?.data?.message || t("user_created_successfully", keys)
            );
            router.push("/admin/all_user");
          } else if (response.status === 200) {
            ToastSuccessMessage(
              response?.data?.message || t("user_updated_successfully", keys)
            );
            router.push("/admin/all_user");
          }
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      };
      manageUser();
    },
  });

  // useEffect(() => {
  //   if (session && !session?.user?.navigation?.includes("/all_user")) {
  //     signOut({ redirect: true, callbackUrl: "/admin/login" });
  //   }
  // }, [session]);
  return (
    <PageContainer
      topbar={<></>}
    >
      <Loader loading={loading} />
      <form encType="multipart/form-data" onSubmit={formik.handleSubmit}>
        {session && session?.user?.navigation?.includes("/admin/all_user") ? (
          <Box mt={1} sx={{ overflowX: "hidden" }}>
            <>
              {session?.user?.roles?.includes("SuperAdmin") && (
                <Grid container spacing={4} columns={{ xs: 4, lg: 8 }}>
                  <Grid size={{ xs: 12, lg: 3 }}>
                    <Box>
                      <CustomFormLabel required>
                        {t("first_name", keys)}
                      </CustomFormLabel>
                      <CustomTextField
                        fullWidth
                        id="first_name"
                        name="first_name"
                        value={formik.values.first_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t("type_here", keys)}
                        error={
                          formik.touched?.first_name &&
                          Boolean(formik.errors?.first_name)
                        }
                        helperText={
                          formik.touched?.first_name &&
                          t(formik.errors?.first_name as string, keys)
                        }
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 3 }}>
                    <Box>
                      <CustomFormLabel required>
                        {t("last_name", keys)}
                      </CustomFormLabel>
                      <CustomTextField
                        fullWidth
                        id="last_name"
                        name="last_name"
                        value={formik.values.last_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t("type_here", keys)}
                        error={
                          formik.touched?.last_name &&
                          Boolean(formik.errors?.last_name)
                        }
                        helperText={
                          formik.touched?.last_name &&
                          t(formik.errors?.last_name as string, keys)
                        }
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 3 }}>
                    <Box>
                      <CustomFormLabel required>{t("email", keys)}</CustomFormLabel>
                      <CustomTextField
                        fullWidth
                        id="email"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t("type_here", keys)}
                        error={
                          formik.touched?.email &&
                          Boolean(formik.errors?.email)
                        }
                        helperText={
                          formik.touched?.email &&
                          t(formik.errors?.email as string, keys)
                        }
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 3 }}>
                    <Box>
                      <CustomFormLabel required>
                        {t("confirm_email", keys)}
                      </CustomFormLabel>
                      <CustomTextField
                        fullWidth
                        id="confirm_email"
                        name="confirm_email"
                        value={formik.values.confirm_email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t("type_here", keys)}
                        error={
                          formik.touched?.confirm_email &&
                          Boolean(formik.errors?.confirm_email)
                        }
                        helperText={
                          formik.touched?.confirm_email &&
                          t(formik.errors?.confirm_email as string, keys)
                        }
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 3 }}>
                    <Box>
                      <CustomFormLabel required>
                        {t("username", keys)}
                      </CustomFormLabel>
                      <CustomTextField
                        fullWidth
                        id="username"
                        name="username"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t("type_here", keys)}
                        error={
                          formik.touched?.username &&
                          Boolean(formik.errors?.username)
                        }
                        helperText={
                          formik.touched?.username &&
                          t(formik.errors?.username as string, keys)
                        }
                      />
                    </Box>
                  </Grid>
                  {action === "create" && (
                    <>
                      {" "}
                      <Grid size={{ xs: 12, lg: 3 }}>
                        <Box>
                          <CustomFormLabel required>
                            {t("password", keys)}
                          </CustomFormLabel>
                          <CustomTextField
                            type="password"
                            fullWidth
                            id="password"
                            name="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder={t("type_here", keys)}
                            error={
                              formik.touched?.password &&
                              Boolean(formik.errors?.password)
                            }
                            helperText={
                              formik.touched?.password &&
                              t(formik.errors?.password as string, keys)
                            }
                          />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, lg: 3 }}>
                        <Box>
                          <CustomFormLabel required>
                            {t("confirm_password", keys)}
                          </CustomFormLabel>
                          <CustomTextField
                            type="password"
                            fullWidth
                            id="confirm_password"
                            name="confirm_password"
                            value={formik.values.confirm_password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder={t("type_here", keys)}
                            error={
                              formik.touched?.confirm_password &&
                              Boolean(formik.errors?.confirm_password)
                            }
                            helperText={
                              formik.touched?.confirm_password &&
                              t(formik.errors?.confirm_password as string, keys)
                            }
                          />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, lg: 3 }}></Grid>
                    </>
                  )}
                </Grid>
              )}
            </>
          </Box>
        ) : (
          ""
        )}

        <Box className="flex justify-end gap-4 mt-4">
          <Button
            variant="contained"
            type="submit"
            sx={{ width: "172px", height: "56px", fontSize: "16px", }}
          >
            {action === "create" ? t("save", keys) : t("update", keys)}
          </Button>
        </Box>
      </form>
    </PageContainer>
  );
};

export default ManageEmployee;
