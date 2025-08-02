import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Grid,
} from "@mui/material";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomFormButton from "@/components/forms/theme-elements/CustomFormButton";
import axios from "axios";
import { ToastSuccessMessage } from "../common/ToastMessages";
import PageContainer from "../container/PageContainer";
import { t } from "../../../lib/translationHelper";
import { useSelector } from "@/store/Store";
import Loader from "../loader/Loader";
import CustomTextField from "../forms/theme-elements/CustomTextField";
import AccessDenied from "../NoAccessPage";
import { checkAccess } from "../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";

const validationSchema = Yup.object({
  earn_amount: Yup.number().required("required").min(0),
  earn_points: Yup.number().required("required").min(0),
  redeem_points: Yup.number().required("required").min(0),
  redeem_amount: Yup.number().required("required").min(0),
  max_redeem_pct: Yup.number().required("required").min(0).max(100),
  expires_in_days: Yup.number().nullable().min(0),
});

export default function Component({ session }: { session: any }) {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  const formik = useFormik({
    initialValues: {
      earn_amount: 0,
      earn_points: 0,
      redeem_points: 0,
      redeem_amount: 0,
      max_redeem_pct: 0,
      expires_in_days: 0,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const res = await axios.post("/api/loyalty/createloyalty", values);
        ToastSuccessMessage(res.data?.message || "Loyalty settings saved!");
      } catch (err) {
        console.error("Error saving loyalty settings", err);
      }
    },
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/app-translation/fetchbypagename", { page_name: "loyalty" });
        setKeys(response.data);
      } catch (error) {
        console.error("Translation fetch error", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/loyalty/singleloyalty", {});
        if (response.status === 200) {
          const data = response.data.data;
          formik.setValues({
            earn_amount: data.earn_amount,
            earn_points: data.earn_points,
            redeem_points: data.redeem_points,
            redeem_amount: data.redeem_amount,
            max_redeem_pct: data.max_redeem_pct,
            expires_in_days: data.expires_in_days || 0,
          });
        }
      } catch (error) {
        console.error("Loyalty fetch error", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);
  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/loyalty")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            (session.user as any).accessrights
              ?.controls as AccessRights2,
            "/admin/loyalty",
            "view"
          ))) ? (<PageContainer topbar={<></>}>
            <Loader loading={loading} />
            <form onSubmit={formik.handleSubmit}>
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} lg={6}>
                    <CustomFormLabel required>{t("spend_vs_earn", keys)}</CustomFormLabel>
                    <Table className="w-full mt-2 border">
                      <TableHead>
                        <TableCell sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                        }}>{t("spend_amount", keys)}</TableCell>
                        <TableCell sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                        }}>{t("earn_points", keys)}</TableCell>
                      </TableHead>
                      <TableBody>
                        <TableCell sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                        }}>
                          <TextField
                            fullWidth
                            type="number"
                            {...formik.getFieldProps("earn_amount")}
                            error={formik.touched.earn_amount && Boolean(formik.errors.earn_amount)}
                            helperText={formik.touched.earn_amount && t(formik.errors.earn_amount as string, keys)}
                            InputProps={{ endAdornment: <InputAdornment position="end">$</InputAdornment> }}
                          />
                        </TableCell>
                        <TableCell sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                        }}>
                          <TextField
                            fullWidth
                            type="number"
                            {...formik.getFieldProps("earn_points")}
                            error={formik.touched.earn_points && Boolean(formik.errors.earn_points)}
                            helperText={formik.touched.earn_points && t(formik.errors.earn_points as string, keys)}
                          />
                        </TableCell>
                      </TableBody>
                    </Table>
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <CustomFormLabel required>{t("redeem_points_vs_discount", keys)}</CustomFormLabel>
                    <Table className="w-full mt-2 border">
                      <TableHead>
                        <TableCell sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                        }}>{t("points_required", keys)}</TableCell>
                        <TableCell sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                        }}>{t("discount_amount", keys)}</TableCell>
                      </TableHead>
                      <TableBody>
                        <TableCell sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                        }}>
                          <TextField
                            fullWidth
                            type="number"
                            {...formik.getFieldProps("redeem_points")}
                            error={formik.touched.redeem_points && Boolean(formik.errors.redeem_points)}
                            helperText={formik.touched.redeem_points && t(formik.errors.redeem_points as string, keys)}
                          />
                        </TableCell>
                        <TableCell sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                        }}>
                          <TextField
                            fullWidth
                            type="number"
                            {...formik.getFieldProps("redeem_amount")}
                            error={formik.touched.redeem_amount && Boolean(formik.errors.redeem_amount)}
                            helperText={formik.touched.redeem_amount && t(formik.errors.redeem_amount as string, keys)}
                            InputProps={{ endAdornment: <InputAdornment position="end">$</InputAdornment> }}
                          />
                        </TableCell>
                      </TableBody>
                    </Table>
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <CustomFormLabel required>{t("max_discount_pct", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      type="number"
                      {...formik.getFieldProps("max_redeem_pct")}
                      error={formik.touched.max_redeem_pct && Boolean(formik.errors.max_redeem_pct)}
                      helperText={formik.touched.max_redeem_pct && t(formik.errors.max_redeem_pct as string, keys)}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    />
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <CustomFormLabel>{t("expiry_days", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      type="number"
                      {...formik.getFieldProps("expires_in_days")}
                      error={formik.touched.expires_in_days && Boolean(formik.errors.expires_in_days)}
                      helperText={formik.touched.expires_in_days && t(formik.errors.expires_in_days as string, keys)}
                    />
                  </Grid>
                </Grid>

                {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/loyalty")) ||
                  (session?.user?.roles?.includes("BackOfficeUser") &&
                    checkAccess(
                      (session.user as any).accessrights
                        ?.controls as AccessRights2,
                      "/admin/loyalty",
                      "edit"
                    ))) && ((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/loyalty")) ||
                      (session?.user?.roles?.includes("BackOfficeUser") &&
                        checkAccess(
                          (session.user as any).accessrights
                            ?.controls as AccessRights2,
                          "/admin/loyalty",
                          "add"
                        ))) && (<Box mt={4} display="flex" justifyContent="flex-end">
                          <CustomFormButton type="submit" variant="contained">
                            {t("save", keys)}
                          </CustomFormButton>
                        </Box>)}
              </Box>
            </form>
          </PageContainer>) : (<AccessDenied />)}
    </>
  );
}
