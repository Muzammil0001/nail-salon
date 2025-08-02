import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Link, Box } from '@mui/material';
import CustomFormLabel from '@/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from '@/components/forms/theme-elements/CustomTextField';
import Loader from '@/components/loader/Loader';
import { AccountCircle } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useSelector } from '@/store/Store';
import { t } from '../../../../lib/translationHelper';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const language_id = localStorage.getItem('language_id');
        const response = await axios.post('/api/app-translation/fetchbypagename', {
          language_id,
          page_name: 'auth',
        });
        setKeys(response.data);
      } catch (error) {
        console.error('Error while fetching translations:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("invalid_email")
        .required("email_required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        localStorage.setItem('userEmail', values.email);
        await axios.post('/api/user/forgotpassword', values);
        router.push('/admin/otp-verification');
      } catch (error) {
        console.error('Forgot password error', error);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box className="flex min-h-screen bg-gradient-to-br to-[#1d0c5f] from-white">
      <Loader loading={loading} />

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
            {t('forgot_password', keys)}
          </Typography>
          <Typography variant="body2" align="center" className="mb-4 text-gray-600">
            {t('enter_email_reset_otp', keys)}
          </Typography>

          <Box>
            <CustomFormLabel required>{t('email', keys)}</CustomFormLabel>
            <CustomTextField
              name="email"
              fullWidth
              variant="outlined"
              margin="normal"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder={t('enter_your_email', keys)}
              InputProps={{
                startAdornment: <AccountCircle sx={{ color: 'gray', mr: 1 }} />,
              }}
              error={formik.touched.email && !!formik.errors.email}
              helperText={formik.touched.email && t(formik.errors.email as string, keys)}
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{
              mt: 4,
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
              },
              padding: '12px',
              fontSize: '16px',
            }}
            disabled={loading}
          >
            {t('generate_otp', keys)}
          </Button>

          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontSize: '14px', color: 'gray' }}>
              {t('remembered_password', keys)}{' '}
              <Link
                href="/admin/login"
                variant="body2"
                sx={{
                  color: '#3b82f6',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('sign_in', keys)}
              </Link>
            </Typography>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

ForgotPasswordPage.layout = 'Blank';
export default ForgotPasswordPage;
