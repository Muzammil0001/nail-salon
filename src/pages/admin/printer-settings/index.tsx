import PageContainer from "@/components/container/PageContainer";
import { Box, Typography, FormControlLabel, Button } from "@mui/material";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { t } from "../../../../lib/translationHelper";
import Loader from "@/components/loader/Loader";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { checkAccess } from "../../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import { useSelector } from "@/store/Store";
import CustomCheckbox from "@/components/forms/theme-elements/CustomCheckbox";
import { useRouter } from "next/router";

const PrinterSet = ({ session }: { session: any }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "printer_settings" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      }
    })();
  }, [languageUpdate]);

  const formik = useFormik({
    initialValues: {
      consolidated_tickets_for_expediter: false,
      split_tickets_into_courses: false,
    },
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/appsettings/saveprintersettings",
          values
        );
        if (response.status === 200 || response.status === 201) {
          ToastSuccessMessage(response?.data?.message || "saved!");
        }
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    (async () => {
      const response = await axios.post("/api/appsettings/getprintersettings");
      formik.setValues(response.data);
    })();
  }, []);

  return (
    <>
      <PageContainer
        css={{ marginBottom: "0px", height: { xs: "750px", xl: "100vh" } }}
        topbar={<div className="h-10" />}
      >
        <Loader loading={loading} />
        <Box>
          <Typography variant="h6" mb={2}>
            {t("printer_features", keys)}
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <Box
              sx={{
                height: "calc(100vh - 150px)",
                minHeight: "50vh",
                maxHeight: "72vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box className="flex flex-col gap-2">
                <FormControlLabel
                  control={
                    <CustomCheckbox
                      checked={formik.values.consolidated_tickets_for_expediter}
                      onChange={(e) =>
                        formik.setFieldValue(
                          "consolidated_tickets_for_expediter",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label={t("consolidated_tickets_for_expediter", keys)}
                />
                <FormControlLabel
                  control={
                    <CustomCheckbox
                      checked={formik.values.split_tickets_into_courses}
                      onChange={(e) =>
                        formik.setFieldValue(
                          "split_tickets_into_courses",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label={t("split_tickets_into_courses", keys)}
                />
              </Box>
              <div className="flex justify-end mt-10">
                {(session?.user?.roles?.includes("Owner") ||
                  (session?.user?.roles?.includes("BackOfficeUser") &&
                    checkAccess(
                      session.user.accessrights?.controls as AccessRights2,
                      "/admin/printer-settings",
                      "edit"
                    ))) && (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{
                      width: "172px",
                      height: "56px",
                      fontSize: "16px",
                    }}
                  >
                    {t("save", keys)}
                  </Button>
                )}
              </div>
            </Box>
          </form>
        </Box>
      </PageContainer>
    </>
  );
};

const PrinterSettings = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/printer-settings")) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <div>
      {session && session?.user?.navigation?.includes("/admin/printer-settings") && (
        <PrinterSet session={session} />
      )}
    </div>
  );
};

export default PrinterSettings;
