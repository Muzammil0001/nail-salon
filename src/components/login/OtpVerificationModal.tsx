import React, { useEffect, useState } from "react";
import { Modal, Box, Button, Typography, TextField } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import ForgetPasswordModal from "./ResetPasswordModal"; // Import the ResetPasswordModal component

interface OtpVerificationModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  onOtpVerified: () => void;
}

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  open,
  onClose,
  email,
  onOtpVerified,
}) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openResetPassword, setOpenResetPassword] = useState(false); // State to control the visibility of ResetPasswordModal

  useEffect(() => {
    if (!open) return;

    setTimeLeft(60);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const formik = useFormik({
    initialValues: { otp: "" },
    validationSchema: Yup.object({
      otp: Yup.string()
        .length(6, "OTP must be 6 digits")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      setError("");
      setLoading(true);

      if (timeLeft <= 0) {
        setError("OTP has expired. Please request a new one.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post("/api/auth/verifyotppass", {
          email,
          otp: values.otp,
        });
        console.log(res);

        const data = res.data;
        if (data.success) {
          // OTP verified successfully, open the ResetPasswordModal
          onOtpVerified(); // Open the reset password modal
          formik.resetForm();
          onClose(); // Close OTP modal
        } else {
          setError(data.message || "Invalid OTP.");
        }
      } catch (err) {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose}>
      <>
        <Box
          width={400}
          p={4}
          bgcolor="white"
          borderRadius={2}
          mx="auto"
          mt="15%"
        >
          <Typography variant="h6">Enter OTP sent to your email</Typography>
          <Typography color="text.secondary" mb={2}>
            Expires in {timeLeft}s
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="otp"
              name="otp"
              label="OTP"
              margin="normal"
              onChange={formik.handleChange}
              value={formik.values.otp}
              error={formik.touched.otp && Boolean(formik.errors.otp)}
              helperText={formik.touched.otp && formik.errors.otp}
            />
            {error && <Typography color="error">{error}</Typography>}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              Verify OTP
            </Button>
          </form>
        </Box>
      </>
    </Modal>
  );
};

export default OtpVerificationModal;
