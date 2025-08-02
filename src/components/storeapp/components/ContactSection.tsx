import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  Box,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSelector } from "@/store/Store";
import { IconPhone, IconMail, IconMapPin } from '@tabler/icons-react';
import { t } from "../../../../lib/translationHelper";
import axios from "axios";
import { ToastErrorMessage, ToastSuccessMessage } from "@/components/common/ToastMessages";
import Loader from "@/components/loader/Loader";
type Props = {
  keys: { text: string; translation: string }[];
};

export default function ContactSection({ keys }: Props) {
  const selectedLocation: any = useSelector((state) => state.selectedLocation).selectedLocation;
const [loading, setLoading]=useState(false)
  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      message: "",
      location_id: "",
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required("first_name_required"),
      lastName: Yup.string().required("last_name_required"),
      phone: Yup.string().required("phone_required"),
      email: Yup.string().email("invalid_email").required("email_required"),
      address: Yup.string().required("address_required"),
      message: Yup.string().required("message_required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true)
        values.location_id = selectedLocation?.id
        console.log("Form Data:", values);
        const response = await axios.post("/api/clients/contactmessage", values)
        ToastSuccessMessage(response.data?.message || "Your Query Sent Successfully")
        formik.resetForm();
      } catch (error:any) {
        ToastErrorMessage(error)
        console.error("Error submitting form:", error);
      }finally{
        setLoading(false)
      }
    },
    validateOnBlur: false,
    validateOnChange: false,
  });

  return (
    <Box id="contactus" sx={{ py: { lg: 10, xs: 2 } }}>
      <Loader loading={loading}/>
      <Box sx={{ marginX: { lg: "60px", xs: "10px" } }}>
        <Paper elevation={1} sx={{ overflow: "hidden", backgroundColor: "#fff" }}>
          <Grid container>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                backgroundColor: "#fff",
                p: { xs: 3, sm: 4, md: 6 },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h3" fontWeight={700} gutterBottom>
                {t("lets_talk", keys)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: "text.secondary", fontSize: "16px" }}>
                {t("got_questions_or_just_want_to_say_hi", keys)}
              </Typography>

              <Box mt={3} display="flex" flexDirection="column" gap={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconPhone className="w-5 h-5" />
                  <Typography>{selectedLocation?.location_phone}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconMail className="w-5 h-5" />
                  <Typography>{selectedLocation?.location_email}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconMapPin className="w-5 h-5" />
                  <Typography sx={{ wordBreak: "break-word" }}>
                    {`${selectedLocation?.street}, ${selectedLocation?.city}, ${selectedLocation?.state} ${selectedLocation?.postcode}, ${selectedLocation?.country}`}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6} sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
              <Typography variant="h5" fontWeight={600} mb={2}>
                {t("contact_form", keys)}
              </Typography>
              <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      sx={{ borderBottom: formik.errors.firstName ? "none" : "1px solid #6E082F" }}
                      fullWidth
                      id="firstName"
                      name="firstName"
                      label={t("first_name", keys)}
                      variant="standard"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      error={Boolean(formik.errors.firstName && formik.submitCount > 0)}
                      helperText={formik.submitCount > 0 && t(formik.errors.firstName as string, keys)}
                      InputProps={{ disableUnderline: false }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      sx={{ borderBottom: formik.errors.lastName ? "none" : "1px solid #6E082F" }}
                      fullWidth
                      id="lastName"
                      name="lastName"
                      label={t("last_name", keys)}
                      variant="standard"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      error={Boolean(formik.errors.lastName && formik.submitCount > 0)}
                      helperText={formik.submitCount > 0 && t(formik.errors.lastName as string, keys)}
                      InputProps={{ disableUnderline: false }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="phone"
                      name="phone"
                      label={t("phone", keys)}
                      variant="standard"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      sx={{ borderBottom: formik.errors.phone ? "none" : "1px solid #6E082F" }}
                      error={Boolean(formik.errors.phone && formik.submitCount > 0)}
                      helperText={formik.submitCount > 0 && t(formik.errors.phone as string, keys)}
                      InputProps={{ disableUnderline: false }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label={t("email", keys)}
                      variant="standard"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      sx={{ borderBottom: formik.errors.email ? "none" : "1px solid #6E082F" }}
                      error={Boolean(formik.errors.email && formik.submitCount > 0)}
                      helperText={formik.submitCount > 0 && t(formik.errors.email as string, keys)}
                      InputProps={{ disableUnderline: false }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="address"
                      name="address"
                      label={t("address", keys)}
                      variant="standard"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      sx={{ borderBottom: formik.errors.address ? "none" : "1px solid #6E082F" }}
                      error={Boolean(formik.errors.address && formik.submitCount > 0)}
                      helperText={formik.submitCount > 0 && t(formik.errors.address as string, keys)}
                      InputProps={{ disableUnderline: false }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="message"
                      name="message"
                      label={t("message", keys)}
                      variant="standard"
                      multiline
                      rows={4}
                      value={formik.values.message}
                      onChange={formik.handleChange}
                      sx={{ borderBottom: formik.errors.message ? "none" : "1px solid #6E082F" }}
                      error={Boolean(formik.errors.message && formik.submitCount > 0)}
                      helperText={formik.submitCount > 0 && t(formik.errors.message as string, keys)}
                      InputProps={{ disableUnderline: false }}
                    />
                  </Grid>

                  <Grid item xs={12} textAlign="right">
                    <Button
                      variant="contained"
                      type="submit"
                      size="large"
                      sx={{
                        backgroundColor: "#6E082F",
                        px: 3,
                        py: 1.5,
                        borderRadius: 0,
                        "&:hover": { backgroundColor: "#880a3a" },
                      }}
                    >
                      {t("send_message", keys)}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}
