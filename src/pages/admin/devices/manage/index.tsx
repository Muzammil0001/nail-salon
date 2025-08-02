import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import PageContainer from "@/components/container/PageContainer";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loader from "@/components/loader/Loader";
import axios from "axios";
import { useSession } from "next-auth/react";
import CustomSelect from "@/components/forms/theme-elements/CustomSelect";
import CustomSelectCheckbox from "../../../../components/forms/MultiSelect/CustomSelectCheckbox";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "@/components/common/ToastMessages";
import { checkAccess } from "../../../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import { useSelector } from "@/store/Store";
import { t } from "../../../../../lib/translationHelper";
import Flag from "react-world-flags";
import CustomCheckbox from "@/components/forms/theme-elements/CustomCheckbox";

interface User {
  id: string;
}

interface Session {
  user: User | null;
}

interface DeviceData {
  device_name: string;
  device_id: string;
}

const validationSchema = Yup.object({
  device_name: Yup.string().required("Device Name is required"),
  device_id: Yup.string().required("Device ID is required"),
});

const ManageDevices = () => {
  const router = useRouter();

  const [action, setAction] = useState("create");
  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAction, setSubmitAction] = useState<"save" | "saveAndContinue">(
    "save"
  );

  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "devices" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const { data: session }: any = useSession();

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (router.query.action === "view" && router.query.id) {
        setLoading(true);
        try {
          const response = await axios.post<{ data: DeviceData }>(
            "/api/devices/getsingledevice",
            { id: router.query.id }
          );
          console.log(response.data.data);
          setData(response.data.data);
          setAction("view");
        } catch (err) {
          setError("Failed to fetch device data.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDeviceData();
  }, [router.query]);

  const formik = useFormik({
    initialValues: {
      device_name: "",
      device_id: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const requestData = {
        ...values,
        location_id: session?.user.selected_location_id,
        id: session?.user.id,
      };

      if (action === "create") {
        try {
          setLoading(true);
          if (action === "create") {
            const response = await axios.post(
              "/api/devices/createdevices",
              requestData
            );
            ToastSuccessMessage(response?.data?.message || "created!");
            if (submitAction === "save") {
              router.push("/admin/devices");
            } else {
              formik.resetForm();
            }
          }
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      } else if (action === "view" && data) {
        try {
          setLoading(true);
          const response = await axios.post("/api/devices/updatedevice", {
            ...requestData,
            id: router.query.id,
          });
          ToastSuccessMessage(response?.data?.message || "updated!");
          router.push("/admin/devices");
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      }
    },
  });
  useEffect(() => {
    if (action === "view" && data) {
      formik.setValues({
        device_name: data.device_name || "",
        device_id: data.device_id || "",
      });
    }
  }, [action, data]);

  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/devices")) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/devices")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            session.user.accessrights?.controls as AccessRights2,
            "/admin/devices",
            action === "create" ? "add" : "edit"
          ))) && (
        <PageContainer topbar={<Box height={50}></Box>}>
          <Loader loading={loading} />
          <Box p={4}>
            <Paper elevation={0}>
              <form onSubmit={formik.handleSubmit}>
                <Box mt={2}>
                  <Grid container spacing={3}>
                    {error && (
                      <Grid item xs={12}>
                        <Alert severity="error">{error}</Alert>
                      </Grid>
                    )}
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={3}>
                        <CustomFormLabel required>
                          {t("device_name", keys)}
                        </CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          id="device_name"
                          name="device_name"
                          value={formik.values.device_name}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.device_name &&
                            Boolean(formik.errors.device_name)
                          }
                          helperText={
                            formik.touched.device_name &&
                            formik.errors.device_name
                          }
                          placeholder={t("type_here", keys)}
                        />
                      </Grid>
                    </Grid>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={3}>
                        <CustomFormLabel required>
                          {t("device_id", keys)}
                        </CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          id="device_id"
                          name="device_id"
                          value={formik.values.device_id}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.device_id &&
                            Boolean(formik.errors.device_id)
                          }
                          helperText={
                            formik.touched.device_id && formik.errors.device_id
                          }
                          placeholder={t("type_here", keys)}
                        />
                      </Grid>
                    </Grid>

                    <Grid item xs={12}>
                      <div className="flex justify-end items-center gap-4">
                        <Button
                          sx={{ px: 4, py: 2 }}
                          variant="outlined"
                          color="primary"
                          disabled={action === "view"}
                          onClick={() => setSubmitAction("saveAndContinue")}
                          type="submit"
                        >
                          {t("save&continue", keys)}
                        </Button>
                        <Button
                          sx={{ px: 8, py: 2 }}
                          variant="contained"
                          color="primary"
                          onClick={() => setSubmitAction("save")}
                          type="submit"
                        >
                          {t("save", keys)}
                        </Button>
                      </div>
                    </Grid>
                  </Grid>
                </Box>
              </form>
            </Paper>
          </Box>
        </PageContainer>
      )}
    </>
  );
};

export default ManageDevices;
