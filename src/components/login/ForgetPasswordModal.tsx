import { useState } from "react";
import { Modal, Box, Button, TextField, Typography } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";

const ForgetPasswordModal = ({ open, onClose, onEmailVerified }: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError("");

      try {
        const res = await axios.post("/api/auth/verifyemail", {
          email: values.email,
        });

        const data = res.data;
        if (data.success) {
          onEmailVerified(values.email); // Opens OTP modal
          formik.resetForm();
        } else {
          setError(data.message || "Email not found.");
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
      <Box
        p={4}
        bgcolor="white"
        borderRadius={2}
        mx="auto"
        mt="15%"
        width={400}
        boxShadow={3}
      >
        <Typography variant="h6" mb={2}>
          Enter your email
        </Typography>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            margin="normal"
            onChange={formik.handleChange}
            value={formik.values.email}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          {error && (
            <Typography color="error" mt={1}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default ForgetPasswordModal;
