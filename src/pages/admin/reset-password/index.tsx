import React, { useState , useEffect} from 'react';
import { TextField, Button, Typography, Link, Grid, Box, InputAdornment } from '@mui/material';
import { useRouter } from 'next/router';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import CustomFormLabel from '@/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from '@/components/forms/theme-elements/CustomTextField';
import Loader from '@/components/loader/Loader';
import axios from 'axios';
import { ToastErrorMessage, ToastSuccessMessage } from '@/components/common/ToastMessages';
import { useSelector } from "@/store/Store";
import { t } from "../../../../lib/translationHelper";

const ResetPasswordPage = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      newPassword: Yup.string()
        .min(6, "password_min_characters")
        .required("new_password_required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), undefined], "passwords_must_match")
        .required("confirm_password_required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);

      const email = localStorage.getItem('verifiedEmail');
      const encodedOtp = localStorage.getItem('verifiedOtp');
      const otp = encodedOtp ? atob(encodedOtp) : null;

      if (!email || !otp) {
        alert(t('missing_otp_or_email', keys));
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post('/api/user/resetuserpassword', {
          email,
          otp,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        });
        if (response.status === 200) {
          ToastSuccessMessage(t('password_reset_successfully', keys));
          localStorage.removeItem('verifiedEmail');
          localStorage.removeItem('verifiedOtp');
          router.push('/admin/reset-password-success');
        }
      } catch (error: any) {
        ToastErrorMessage(error?.response?.data?.message || t('reset_password_failed', keys));
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box className="flex min-h-screen bg-gradient-to-br to-[#1d0c5f] from-white">
      {loading && <Loader loading={loading} />}
      <Box className="w-[70%] hidden lg:block relative">
        <img src="/img/auth-bg.jpeg" alt="Login image" className="w-full h-screen object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-7xl font-bold !text-white drop-shadow-lg !font-greatVibes">
            Juliet Nails
          </h1>
        </div>
      </Box>

      <Box className="min-h-screen w-full lg:w-[30%] flex items-center justify-center px-4 py-8 bg-white">
        <form onSubmit={formik.handleSubmit} className="lg:w-[500px] sm:w-96 bg-white p-8 rounded-lg border-gray-200">
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            {t('reset_password', keys)}
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 6, color: 'gray', fontSize: '14px' }}>
            {t('please_enter_new_password', keys)}
          </Typography>

          <Box>
            <CustomFormLabel required>{t('new_password', keys)}</CustomFormLabel>
            <CustomTextField
              name="newPassword"
              variant="outlined"
              margin="normal"
              type={showNewPassword ? 'text' : 'password'}
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder={t('enter_new_password', keys)}
              InputProps={{
                startAdornment: <Lock sx={{ color: 'gray', mr: 1 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <Box onClick={() => setShowNewPassword(!showNewPassword)} sx={{ color: 'gray', cursor: 'pointer' }}>
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </Box>
                  </InputAdornment>
                ),
              }}
              fullWidth
              error={formik.touched.newPassword && !!formik.errors.newPassword}
              helperText={formik.touched.newPassword && t(formik.errors.newPassword as string, keys)}
              sx={{ mb: 2 }}
            />
          </Box>

          <Box>
            <CustomFormLabel required>{t('confirm_password', keys)}</CustomFormLabel>
            <CustomTextField
              name="confirmPassword"
              variant="outlined"
              margin="normal"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder={t('confirm_new_password', keys)}
              InputProps={{
                startAdornment: <Lock sx={{ color: 'gray', mr: 1 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <Box onClick={() => setShowConfirmPassword(!showConfirmPassword)} sx={{ color: 'gray', cursor: 'pointer' }}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </Box>
                  </InputAdornment>
                ),
              }}
              fullWidth
              error={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
              helperText={formik.touched.confirmPassword && t(formik.errors.confirmPassword as string, keys)}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{
              mt: 4,
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
              },
            }}
          >
            {t('reset_password', keys)}
          </Button>

          <Grid container spacing={2} justifyContent="center" sx={{ mt: 3 }} className="md:flex-col md:items-center flex-nowrap">
            <Box sx={{ width: { md: '100%' }, textAlign: { md: 'center' } }}>
              <Typography variant="body2" sx={{ fontSize: '14px' }}>
                {t('remembered_password', keys)}{' '}
                <Link
                  href="/admin/login"
                  variant="body2"
                  sx={{
                    color: '#3b82f6',
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    textWrap: 'nowrap',
                  }}
                >
                  {t('sign_in', keys)}
                </Link>
              </Typography>
            </Box>
          </Grid>
        </form>
      </Box>
    </Box>
  );
};

ResetPasswordPage.layout = 'Blank';
export default ResetPasswordPage;
