import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  AlertTitle,
} from "@mui/material";
import Link from "next/link";
import { loginType } from "../../../src/types/auth/auth";
import CustomTextField from "../../../src/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "../../../src/components/forms/theme-elements/CustomFormLabel";

import { ReactEventHandler, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import Loader from "../../../src/components/loader/Loader";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import ForgetPasswordModal from "./ForgetPasswordModal";
import OtpVerificationModal from "./OtpVerificationModal";
import ResetPasswordModal from "./ResetPasswordModal";

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const router = useRouter();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {},
  });
  useEffect(() => {
    if (session) {
      if (session?.user?.roles?.includes("SuperAdmin")) {
        router.push({ pathname: "/admin/clients", query: { show: "1" } });
      } else {
        // router.push({ pathname: "/admin/dashboard", query: { show: "1" } });
      }
    }
  }, [session]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signInError, setSignInError] = useState(false);
  const [show, setShow] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    document.addEventListener("keypress", handleKeyPress);
    return () => {
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit(event);
    }
  };

  const handleSubmit = async (event: any) => {
    try {
      event.preventDefault();
      event.stopPropagation();
      setSignInError(false);
      setSignIn(false);
      setLoading(true);

      if (username && password) {
        const response = await signIn("credentials", {
          username,
          password: btoa(password),
          redirect: false,
          // callbackUrl: `/dashboard`,
        });
        if (response?.error) {
          setLoading(false);
          ToastErrorMessage("login_unsuccessful");
        } else {
          setLoading(false);
          ToastSuccessMessage("login_success");
        }
      } else {
        setLoading(false);
        ToastErrorMessage("missing_username_or_password");
      }
    } catch (error) {
      setLoading(false);
      ToastErrorMessage("login_unsuccessful");
    }
  };

  return (
    <Box className="py-12">
      <Loader loading={loading} />

      <>
        {signedIn && (
          <Alert severity="success" className="mb-4">
            <AlertTitle>
              <strong>{"login_success"}</strong>
            </AlertTitle>
          </Alert>
        )}
        {signInError && (
          <Alert severity="error" className="mb-4">
            <AlertTitle>
              <strong>{"login_unsuccessful"}</strong>
            </AlertTitle>
          </Alert>
        )}
        {title ? (
          <Typography fontWeight="700" variant="h3" mb={1}>
            {title}
          </Typography>
        ) : null}

        {subtext}

        <Stack>
          <Box>
            <CustomFormLabel htmlFor="username">
              {t("username_or_email")}
            </CustomFormLabel>
            <CustomTextField
              id="username"
              type="username"
              variant="outlined"
              autoComplete="off"
              fullWidth
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                e.preventDefault();
                e.stopPropagation();
                setUsername(e.target.value);
              }}
            />
          </Box>
          <Box sx={{ position: "relative" }}>
            <CustomFormLabel htmlFor="password">
              {t("password")}
            </CustomFormLabel>
            {show ? (
              <IconEye
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "10px",
                  zIndex: 50,
                }}
                size={18}
                onClick={() => setShow((prev) => !prev)}
              />
            ) : (
              <IconEyeOff
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "10px",
                  zIndex: 50,
                }}
                size={18}
                onClick={() => setShow((prev) => !prev)}
              />
            )}
            <CustomTextField
              id="password"
              type={show ? "text" : "password"}
              variant="outlined"
              fullWidth
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                e.preventDefault();
                e.stopPropagation();
                setPassword(e.target.value);
              }}
              onKeyPress={handleKeyPress}
            />
          </Box>
          <Box className="text-right pt-4 pb-8">
            <Button
              onClick={() => setShowForgotModal(true)}
              variant="text"
              // sx={{
              //   textTransform: "none",
              //   p: 0,
              //   minWidth: "auto",
              //   color: "primary.main",
              // }}
            >
              {t("forgot_password")}
            </Button>
          </Box>
        </Stack>
        <Box>
          <Button
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
          >
            {t("sign_in")}
          </Button>
        </Box>
        <Box>
          <Typography fontWeight="500" className="text-center pt-4">
            Don’t Have an Account?
            <Typography
              component={Link}
              href="/signup"
              fontWeight="500"
              sx={{
                textDecoration: "none",
                color: "primary.main",
              }}
            >
              Sign Up
            </Typography>
          </Typography>
        </Box>
      </>
      <ForgetPasswordModal
        open={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onEmailVerified={(email: string) => {
          setVerifiedEmail(email);
          setShowForgotModal(false);
          setShowOtpModal(true);
        }}
      />

      <ForgetPasswordModal
        open={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onEmailVerified={(email: string) => {
          setVerifiedEmail(email);
          setShowForgotModal(false);
          setShowOtpModal(true);
        }}
      />

      <OtpVerificationModal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={verifiedEmail}
        onOtpVerified={() => {
          setShowOtpModal(false);
          setShowResetModal(true);
        }}
      />

      <ResetPasswordModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </Box>
  );
};

export default AuthLogin;
