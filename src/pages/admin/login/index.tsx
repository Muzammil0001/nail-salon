import React, { useState, useEffect } from "react";
import {
  TextField,
  Alert,
  AlertTitle,
  Button,
  Typography,
  Link,
  Grid,
  Box,
  InputAdornment,
} from "@mui/material";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import {
  AccountCircle,
  Lock,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import Loader from "@/components/loader/Loader";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "@/components/common/ToastMessages";
import { signIn, getSession } from "next-auth/react";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import Head from "next/head";
import AdminLanguage from "@/layouts/full/vertical/header/AdminLanguage";
import axios from "axios";
import { useSelector } from "@/store/Store";
import { t } from "../../../../lib/translationHelper";
const Login = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { },
  });
  useEffect(() => {
    if (session) {
      if (session?.user?.roles?.includes("SuperAdmin")) {
        router.push({ pathname: "/admin/clients", query: { show: "1" } });
      } else {
        router.push({ pathname: "/admin/dashboard", query: { show: "1" } });
      }
    }
  }, [session]);
  console.log(session, "session");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const language_id= localStorage.getItem("language_id")
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { language_id, page_name: "auth" }
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
      setLoading(true);

      if (username && password) {
        const response = await signIn("credentials", {
          username,
          password: btoa(password),
          redirect: false,
          callbackUrl: `/admin/dashboard`,
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
    // bg-gradient-to-br to-[#1d0c5f] from-white
    <Box className="flex min-h-screen bg-white">
    <Head>
      <title>Juliet Nails | Login</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
  
    {loading && <Loader loading={loading} />}
  
    <Box className="w-[70%] hidden lg:block relative">
      <Box sx={{ position: "absolute", top: 10, left: 10, zIndex: 2000 }}>
        <AdminLanguage />
      </Box>
      <img
        src="/img/auth-bg.jpeg"
        alt="Login image"
        className="w-full h-screen object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-7xl font-bold !text-white drop-shadow-lg !font-greatVibes">
          Juliet Nails
        </h1>
      </div>
    </Box>
  
    <Box className="w-full lg:w-[30%] lg:border-none lg:bg-white p-8 rounded-none shadow-lg border border-gray-200 flex flex-col justify-center">
      <div className="w-full lg:p-0 lg:shadow-none border-none shadow-lg rounded-xl p-10 lg:bg-transparent bg-white">
        <img
          src="/images/logos/logo.svg"
          alt="logo"
          className="h-16 w-auto mx-auto mb-4"
        />
        <Typography variant="h3" className="text-center mb-2 font-bold">
          {t("welcome_to_juliet_nails", keys)}
        </Typography>
        <Typography
          variant="body2"
          align="center"
          sx={{ mb: 6, color: "gray", fontSize: "14px" }}
        >
          <span className="font-semibold">
            {t("glad_to_see_you_again", keys)}
          </span>{" "}
          {t("please_enter_credentials_to_sign_in", keys)}
        </Typography>
  
        <Box>
          <CustomFormLabel sx={{ mb: "5px" }} required htmlFor="username">
            {t("username_or_email", keys)}
          </CustomFormLabel>
          <CustomTextField
            id="username"
            type="username"
            variant="outlined"
            autoComplete="off"
            fullWidth
            InputProps={{
              startAdornment: <AccountCircle sx={{ color: "gray", mr: 1 }} />,
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              e.preventDefault();
              e.stopPropagation();
              setUsername(e.target.value);
            }}
          />
        </Box>
  
        <Box>
          <CustomFormLabel sx={{ mb: "5px" }} required htmlFor="password">
            {t("password", keys)}
          </CustomFormLabel>
          <CustomTextField
            id="password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              e.preventDefault();
              e.stopPropagation();
              setPassword(e.target.value);
            }}
            InputProps={{
              startAdornment: <Lock sx={{ color: "gray", mr: 1 }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <Box
                    onClick={() => setShowPassword(!showPassword)}
                    sx={{ color: "gray", cursor: "pointer" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Box>
                </InputAdornment>
              ),
            }}
            onKeyPress={handleKeyPress}
          />
        </Box>
  
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            mt: 4,
            padding: "12px",
            fontSize: "16px",
            backgroundColor: "#3b82f6",
            "&:hover": {
              backgroundColor: "#2563eb",
            },
          }}
        >
          {t("sign_in", keys)}
        </Button>
  
        <Box
          sx={{
            mt: 3,
            display: "flex",
            flexWrap: "wrap",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "end",
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", sm: "auto" },
              textAlign: { xs: "center", sm: "right" },
            }}
          >
            <Link
              href="/admin/forgot-password"
              variant="body2"
              sx={{
                color: "#3b82f6",
                fontSize: "14px",
                textDecoration: "none",
                textWrap: "nowrap",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              {t("forgot_password", keys)}
            </Link>
          </Box>
        </Box>
      </div>
    </Box>
  </Box>
  
  );
};

Login.layout = "Blank";
export default Login;
