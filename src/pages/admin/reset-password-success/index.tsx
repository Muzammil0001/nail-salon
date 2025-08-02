import React, { useState, useEffect } from 'react';
import { Typography, Button, Box } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useSelector } from "@/store/Store";
import { t } from "../../../../lib/translationHelper";
import axios from 'axios';
import Loader from '@/components/loader/Loader';

const OtpSuccessPage = () => {
  const router = useRouter();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <Box className="flex min-h-screen bg-gradient-to-br to-[#1d0c5f] from-white">
      <Loader loading={loading} />
      <Box className="w-[70%] hidden lg:block relative">
        <img
          src="/img/auth-bg.jpeg"
          alt={t("login_image_alt", keys)}
          className="w-full h-screen object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-7xl font-bold !text-white drop-shadow-lg !font-greatVibes">
            {t("welcome_to_juliet_nails", keys)}
          </h1>
        </div>
      </Box>

      <Box className="min-h-screen w-full lg:w-[30%] flex items-center justify-center px-4 py-8 bg-white">
        <Box className="w-full max-w-md bg-white rounded-xl p-6 sm:p-8">
          <Box className="flex flex-col gap-4 items-center text-center">
            <CheckCircle sx={{ color: '#76BA1B', fontSize: 64 }} />
            <Typography variant="h5" sx={{ marginTop: "16px", fontWeight: "600", color: "#646464" }}>
              {t("congratulations", keys)}
            </Typography>
            <Typography variant="body1" className="mt-2 text-gray-600">
              {t("password_reset_success_message", keys)}
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              className="mt-6"
              sx={{
                padding: '12px',
                fontSize: '16px',
                mt: "16px",
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb',
                },
              }}
              onClick={() => router.push('/admin/login')}
            >
              {t("go_to_sign_in_page", keys)}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

OtpSuccessPage.layout = "Blank";
export default OtpSuccessPage;
