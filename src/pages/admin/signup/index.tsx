import React, { useState, useEffect, use } from 'react';
import { TextField, Button, Typography, Link, Grid, Box, InputAdornment } from '@mui/material';
import { AccountCircle, Lock, Phone, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik, ErrorMessage } from 'formik';
import CustomFormLabel from '@/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from '@/components/forms/theme-elements/CustomTextField';
import CustomPhoneInput from '@/components/forms/theme-elements/CustomPhoneInput';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ToastErrorMessage, ToastSuccessMessage } from '@/components/common/ToastMessages';
import { getSession } from "next-auth/react";
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
// Define the interface for form values
interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  confirmPassword: string;
  username:string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [placeholder, setPlaceholder] = useState("+1");
  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      console.log('Fetched session:', session);
    };

    fetchSession();
  }, []);

  const formik = useFormik<FormValues>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      username :"",
      phone: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('First name is required').min(2, 'Must be at least 2 characters'),
      username: Yup.string().required('First name is required').min(2, 'Must be at least 2 characters'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      phone: Yup.string().min(10, 'Phone number must be at least 10 digits').required('Phone number is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response =await axios.post("/api/signup/createuser", values);
        if (response.status === 201) {
          console.log('Form values:', values);
          router.push('/admin/login');
          ToastSuccessMessage(response.data.message);
        }
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleCountryChange = (country: any | undefined) => {
    const countryCode = country ? `+${getCountryCallingCode(country)}` : "";
    setPlaceholder(countryCode);
  };

  useEffect(() => {
    formik.setFieldValue('phone', phone);
  }, [phone]);

  return (
    <Box className="flex justify-center items-center min-h-screen">
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
    <Box
      className="w-full lg:w-[30%] lg:border-none lg:bg-white p-8 rounded-none shadow-lg lg:shadow-none border border-gray-200 flex flex-col"
      sx={{
        overflowY: 'auto',
        maxHeight: '100vh',
      }}
    >
      
      <form className="w-full lg:p-0 lg:shadow-none border-none shadow-lg rounded-xl p-10 lg:bg-transparent bg-white" onSubmit={formik.handleSubmit}>
      <img
            src="/images/logos/logo.svg"
            alt="logo"
            className="h-16 w-auto mx-auto mb-4"
          />
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
          Sign Up
        </Typography>
        <Typography variant="body2" align="center" sx={{ mb: 4, color: 'gray', fontSize: '14px' }}>
          Create your account to get started.
        </Typography>

        <Box>
          <CustomFormLabel required>First Name</CustomFormLabel>
          <CustomTextField
            name="firstName"
            fullWidth
            variant="outlined"
            margin="normal"
            value={formik.values.firstName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your first name"
            error={formik.touched.firstName && !!formik.errors.firstName}
            helperText={formik.touched.firstName && formik.errors.firstName}
          />
        </Box>

        <Box>
          <CustomFormLabel>Last Name (Optional)</CustomFormLabel>
          <CustomTextField
            name="lastName"
            fullWidth
            variant="outlined"
            margin="normal"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your last name (Optional)"
            error={formik.touched.lastName && !!formik.errors.lastName}
            helperText={formik.touched.lastName && formik.errors.lastName}
          />
        </Box>

        <Box>
          <CustomFormLabel required>Username</CustomFormLabel>
          <CustomTextField
            name="username"
            fullWidth
            variant="outlined"
            margin="normal"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter username"
            error={formik.touched.username && !!formik.errors.username}
            helperText={formik.touched.username && formik.errors.username}
          />
        </Box>

        <Box>
          <CustomFormLabel required>Email</CustomFormLabel>
          <CustomTextField
            name="email"
            fullWidth
            variant="outlined"
            margin="normal"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your email"
            InputProps={{
              startAdornment: <AccountCircle sx={{ color: 'gray', mr: 1 }} />,
            }}
            error={formik.touched.email && !!formik.errors.email}
            helperText={formik.touched.email && formik.errors.email}
          />
        </Box>

        <Box>
          <style>
            {`
              .custom-phone-input .PhoneInputCountry {
                margin-right: 0 !important;
                border-radius: 2px 0 0 2px !important;
                border-right: 0 !important;
              }
              .custom-phone-input .PhoneInputInput {
                border-radius: 0 2px 2px 0 !important;
              }
            `}
          </style>
          <CustomFormLabel required sx={{mb:"5px"}}>Phone</CustomFormLabel>
          <CustomPhoneInput
            className="custom-phone-input"
            defaultCountry="US"
            id="mobile"
            placeholder={placeholder}
            label="location_phone Number"
            value={formik.values.phone}
            onChange={(phone: any) => formik.setFieldValue("phone", phone)}
            onBlur={() => formik.setFieldTouched("phone", true)}
            onCountryChange={(c: any) => handleCountryChange(c)}
          />
          {formik.touched.phone && formik.errors.phone && (
           <div className="px-2 pt-1 text-xs text-red-500">
           {formik.errors.phone}
         </div>
         
          )}
        </Box>

        <Box>
          <CustomFormLabel required>Password</CustomFormLabel>
          <CustomTextField
            name="password"
            fullWidth
            variant="outlined"
            margin="normal"
            type={showPassword ? 'text' : 'password'}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your password"
            InputProps={{
              startAdornment: <Lock sx={{ color: 'gray', mr: 1 }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer text-gray-500"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </div>
                </InputAdornment>
              ),
            }}
            error={formik.touched.password && !!formik.errors.password}
            helperText={formik.touched.password && formik.errors.password}
          />
        </Box>

        <Box>
          <CustomFormLabel required>Confirm Password</CustomFormLabel>
          <CustomTextField
            name="confirmPassword"
            fullWidth
            variant="outlined"
            margin="normal"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Confirm your password"
            InputProps={{
              startAdornment: <Lock sx={{ color: 'gray', mr: 1 }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <div
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="cursor-pointer text-gray-500"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </div>
                </InputAdornment>
              ),
            }}
            error={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            sx={{ mb: 4 }}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          sx={{
            mt: 4,
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            '&:hover': {
              backgroundColor: '#2563eb',
            },
          }}
          disabled={loading}
        >
          Sign Up
        </Button>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontSize: '14px', color: 'gray' }}>
            Already have an account?{' '}
            <Link
              href="/admin/login"
              variant="body2"
              sx={{
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight:"500",
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  </Box>

  );
};


Signup.layout = "Blank";
export default Signup;
