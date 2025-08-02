import {
  styled,
  Box,
  useTheme,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  DialogContent,
} from "@mui/material";
import { useSelector } from "../../store/Store";
import { AppState } from "../../store/Store";
import Header from "./vertical/header/Header";
import Sidebar from "./vertical/sidebar/Sidebar";
import Customizer from "./shared/customizer/Customizer";
import Navigation from "../full/horizontal/navbar/Navigation";
import HorizontalHeader from "../full/horizontal/header/Header";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertInterface } from "@/types/admin/types";
import axios from "axios";
import { toast } from "sonner";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import Alert from "@/components/alert/Alert";
import Loader from "@/components/loader/Loader";
import { useRouter } from "next/router";
import CustomFormButton from "@/components/forms/theme-elements/CustomFormButton";
import { ToastErrorMessage } from "@/components/common/ToastMessages";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")((theme) => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px",
  flexDirection: "column",
  zIndex: 1,
  width: "60%",
  backgroundColor: "transparent",
}));

interface Props {
  children: React.ReactNode;
}

const FullLayout: React.FC<Props> = ({ children }) => {
  const { t } = useTranslation();
  const customizer = useSelector((state: AppState) => state.customizer);
  const theme = useTheme();
  const { data: session, status }: any = useSession({
    required: true,
  });
  const [alert, setAlert] = useState<AlertInterface | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [data, setData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const updatePassword = async () => {
    try {
      setLoading(true);
      await axios.post("/api/clients/updatepassword", data);
      setOpen(false);
      setAlert({
        open: true,
        title: t("success"),
        description: t("password_updated_successfully"),

        callback: async () => {
          setAlert({ open: false });
          await signOut({ redirect: true, callbackUrl: "/admin/login" });
        },
      });
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };
  const router = useRouter();
  useEffect(() => {
    if (
      session?.user?.locations?.length === 0 &&
      !session?.user?.roles?.includes("SuperAdmin")
    ) {
      router.push({
        // pathname: "/admin/locations-overview/manage",
        query: { action: "create" },
      });
    }
  }, [session]);
  return (
    <>
      <Alert alert={alert} />
      <Loader loading={loading} />
      {session &&
        session?.user?.password_changed &&
        (session?.user?.roles?.includes("SuperAdmin")
          ? true
          : session?.user?.locations?.length > 0) && (
          <MainWrapper>
            {customizer.isHorizontal ? "" : <Sidebar />}
            <PageWrapper
              className="page-wrapper"
              sx={{
                ...(customizer.isCollapse && {
                  [theme.breakpoints.up("lg")]: {
                    ml: `${customizer.MiniSidebarWidth}px`,
                  },
                }),
                background: theme.palette.info.light,
              }}
            >
              {customizer.isHorizontal ? <HorizontalHeader /> : <Header />}
              {/* PageContent */}
              {customizer.isHorizontal ? <Navigation /> : ""}
              <Box
                sx={{
                  maxWidth:
                    customizer.isLayout === "boxed" ? "lg" : "100%!important",
                }}
              >
                <Box
                  sx={{
                    minHeight: "calc(100vh - 170px)",
                  }}
                >
                  {children}
                </Box>
              </Box>
              <Customizer />
            </PageWrapper>
          </MainWrapper>
        )}
      {session &&
        session?.user?.locations?.length === 0 &&
        !session?.user?.roles?.includes("SuperAdmin") && (
          <MainWrapper>
            <PageWrapper
              className="page-wrapper"
              sx={{
                ...(customizer.isCollapse && {
                  [theme.breakpoints.up("lg")]: {
                    ml: `${customizer.MiniSidebarWidth}px`,
                  },
                }),
                background: theme.palette.info.light,
              }}
            >
              {customizer.isHorizontal ? <HorizontalHeader /> : <Header />}
              <Box
                sx={{
                  maxWidth:
                    customizer.isLayout === "boxed" ? "lg" : "100%!important",
                }}
              >
                <Box
                  sx={{
                    minHeight: "calc(100vh - 170px)",
                  }}
                >
                  {children}
                </Box>
              </Box>
              <Customizer />
            </PageWrapper>
          </MainWrapper>
        )}
      {session && session?.user?.password_changed === false && (
        <>
          <Dialog open={open} fullWidth maxWidth="sm">
            <DialogTitle>Update the password</DialogTitle>
            <DialogContent>
              <CustomFormLabel required>
                {t("current_password")}
              </CustomFormLabel>
              <CustomTextField
                fullWidth
                type="password"
                value={data.current_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setData({ ...data, current_password: e.target.value })
                }
                placeholder={t("type_here")}
              />
              <CustomFormLabel required>{t("new_password")}</CustomFormLabel>
              <CustomTextField
                fullWidth
                type="password"
                value={data.new_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setData({ ...data, new_password: e.target.value })
                }
                placeholder={t("type_here")}
              />
              <CustomFormLabel required>
                {t("confirm_password")}
              </CustomFormLabel>
              <CustomTextField
                fullWidth
                type="password"
                value={data.confirm_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setData({ ...data, confirm_password: e.target.value })
                }
                placeholder={t("type_here")}
              />
            </DialogContent>
            <DialogActions>
              <CustomFormButton
                disabled={
                  !data.new_password ||
                  !data.current_password ||
                  data.new_password !== data.confirm_password ||
                  data.new_password.length < 8
                }
                mx-8
                onClick={updatePassword}
                variant="contained"
                className=""
              >
                {t("update")}
              </CustomFormButton>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
  );
};

export default FullLayout;
