import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Grid } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import OtpInput from 'react-otp-input';
import { ToastSuccessMessage, ToastErrorMessage } from '@/components/common/ToastMessages';
import axios from "axios";
import { useSelector } from "@/store/Store";
import { t } from "../../../../lib/translationHelper";

const OtpVerificationPage = () => {
  const [timer, setTimer] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(true);
  const router = useRouter();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const language_id = localStorage.getItem("language_id");
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { language_id, page_name: "auth" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      }
    })();
  }, [languageUpdate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setResendDisabled(false);
    }
  }, [timer]);

  const formik = useFormik({
    initialValues: {
      otp: '',
    },
    validationSchema: Yup.object({
      otp: Yup.string()
        .length(6, "otp_6_digits")
        .matches(/^\d{6}$/, "otp_only_numbers")
        .required("otp_required"),
    }),
    onSubmit: async (values) => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          ToastErrorMessage(t("email_not_found", keys));
          return;
        }

        const res = await axios.post('/api/user/verifyuserotp', {
          email,
          otp: values.otp,
        });

        if (res.status === 200) {
          ToastSuccessMessage(t("otp_verified_success", keys));
          localStorage.removeItem('userEmail');
          localStorage.setItem('verifiedOtp', btoa(values.otp));
          email && localStorage.setItem('verifiedEmail', email);

          router.push('/admin/reset-password');
        }
      } catch (err: any) {
        console.error('OTP verification failed:', err);
        ToastErrorMessage(err.response?.data?.message || t("otp_verification_failed", keys));
      }
    },
  });

  const handleResendOtp = () => {
    setTimer(30);
    setResendDisabled(true);
  };

  return (
    <Box className="flex min-h-screen bg-gradient-to-br to-[#1d0c5f] from-white">
      <Box className="w-[70%] hidden lg:block relative">
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

      <Box className="min-h-screen w-full lg:w-[30%] flex items-center justify-center px-4 py-8 bg-white">
        <form onSubmit={formik.handleSubmit} className="w-full sm:w-96 bg-white p-8 rounded-lg">

          <Typography variant="h4" align="center" gutterBottom>
            {t("otp_verification", keys)}
          </Typography>
          <Typography sx={{ mb: "16px", textAlign: "center" }}>
            {t("enter_otp_instruction", keys)}
          </Typography>

          <Box className="text-center flex justify-center">
            <OtpInput
              value={formik.values.otp}
              onChange={(otp) => formik.setFieldValue('otp', otp)}
              numInputs={6}
              inputStyle={{
                width: '40px',
                height: '40px',
                margin: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '18px',
                textAlign: 'center',
              }}
              renderInput={(props) => (
                <input
                  {...props}
                  inputMode="numeric"
                  onBlur={() => formik.setFieldTouched('otp', true)}
                />
              )}
              shouldAutoFocus={true}
            />
          </Box>

          <Box>
            {formik.touched.otp && formik.errors.otp && (
              <Typography variant="body2" color="error" align="center" className="mt-2">
                {t(formik.errors.otp as string, keys)}
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{
              padding: '12px',
              fontSize: '16px',
              mt: "40px",
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
              },
            }}
          >
            {t("verify_otp", keys)}
          </Button>

          <Box className="mt-4 text-center">
            <Typography variant="body2">
              {timer > 0 ? (
                <span>{t("resend_otp_in", keys)} {timer}s</span>
              ) : (
                <Button
                  onClick={handleResendOtp}
                  variant="text"
                  color="primary"
                  disabled={resendDisabled}
                  sx={{ textDecoration: 'none' }}
                >
                  {t("resend_otp", keys)}
                </Button>
              )}
            </Typography>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

OtpVerificationPage.layout = "Blank";
export default OtpVerificationPage;

