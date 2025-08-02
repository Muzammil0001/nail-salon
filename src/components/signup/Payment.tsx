import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { IconCircleCheck, IconCircleX, IconX } from "@tabler/icons-react";
import Checkout from "./Checkout";
import Logo from "@/layouts/full/shared/logo/Logo";
import * as yup from "yup";
import { useFormik } from "formik";
import Grid from "@mui/material/Grid2";
import CustomFormLabel from "../forms/theme-elements/CustomFormLabel";
import CustomTextField from "../forms/theme-elements/CustomTextField";
import CustomSwitch from "../switches/CustomSwitch";
import Link from "next/link";
import Loader from "../loader/Loader";
import { getClientEnv } from "../../../lib/getClientEnv";
import { ToastErrorMessage } from "../common/ToastMessages";
const Payment = ({ onboardingData }: { onboardingData: any }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Record<string, any>[]>([]);
  const [features, setFeatures] = useState<Record<string, any>[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingModel, setBillingModel] = useState("MONTHLY");
  const [vat, setVat] = useState(25);
  const [open, setOpen] = useState(false);
  const [openSucces, setOpenSuccess] = useState(false);

  const validationSchema = yup.object().shape({
    firstname: yup
      .string()
      .min(2, t("too_short"))
      .max(50, t("too_long"))
      .required(t("first_name_is_required")),
    lastname: yup
      .string()
      .min(2, t("too_short"))
      .max(50, t("too_long"))
      .required(t("last_name_is_required")),
    email: yup
      .string()
      .email(t("enter_a_valid_email"))
      .required(t("email_is_required")),
    country: yup
      .string()
      .min(2, t("too_short"))
      .max(50, t("too_long"))
      .required(t("country_is_required")),

    street: yup
      .string()
      .min(2, t("too_short"))
      .max(50, t("too_long"))
      .required(t("street_is_required")),
    city: yup
      .string()
      .min(2, t("too_short"))
      .max(50, t("too_long"))
      .required(t("city_is_required")),
    postcode: yup
      .string()
      .min(2, t("too_short"))
      .max(50, t("too_long"))
      .required(t("postcode_is_required")),
    business_invoice: yup.boolean(),
    vat_id: yup
      .string()
      .nullable()
      .when("business_invoice", {
        is: true,
        then: (schema) => schema.required(t("vat_id_is_required")),
      }),
  });
  const initialValues = {
    firstname: "",
    lastname: "",
    email: "",
    country: "",
    street: "",
    city: "",
    postcode: "",
    state: "",
    business_invoice: false,
    vat_id: "",
    terms_agreed: true,
  };
  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: true,
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setOpen(true);
    },
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/subscription/getfeatures");
        setFeatures(response.data.features);
        const response2 = await axios.post(
          "/api/subscription/getsubscriptions",
          { fetchAll: true }
        );
        setPlans(response2.data);

        if (router.query.body && response2.data.length > 0) {
          const params = new URLSearchParams(atob(router.query.body as string));
          setBillingModel(
            params.get("billingModel") === "MONTHLY" ? "MONTHLY" : "YEARLY"
          );
          const plan = response2.data.find(
            (p: any) => p.id === params.get("subscriptionId")
          );
          setSelectedPlan(plan ? plan : response2.data[0]);
        } else if (response2.data.length > 0) {
          setSelectedPlan(response2.data[0]);
        }
        const vat = await getClientEnv("VAT");
        setVat(vat ? parseInt(vat) : 0);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [router.query]);
  const calculateTotal = () => {
    if (billingModel === "MONTHLY") {
      return (selectedPlan.price + selectedPlan.price * (vat / 100)).toFixed(2);
    }
    return (
      selectedPlan.yearly_price +
      selectedPlan.yearly_price * (vat / 100)
    ).toFixed(2);
  };
  const handleSubmit = async (cardSession: any) => {
    try {
      console.log("hello in try");
      setLoading(true);
      await axios.post("/api/signup/updateuser", {
        user: formik.values,
        cardSession,
        billingModel,
        vat,
        selectedPlan,
        price: calculateTotal(),
        base_price:
          billingModel === "MONTHLY"
            ? selectedPlan.price
            : selectedPlan.yearly_price,
        onboardingData,
        vat_amount: (selectedPlan.price * (vat / 100)).toFixed(2),
      });
      setOpen(false);
      setOpenSuccess(true);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box className="min-h-screen flex flex-col xl:flex-row">
      <Loader loading={loading} />
      <Dialog
        BackdropProps={{
          style: {
            backgroundColor: "transparent",
            backdropFilter: "blur(3px)",
          },
        }}
        open={openSucces}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiPaper-root": {
            borderRadius: "24px",
          },
        }}
      >
        <DialogContent className="py-12">
          <Box className="flex flex-col gap-4 justify-center items-center">
            <IconCircleCheck size={60} className="text-primary-main" />
            <Typography className="text-2xl font-bold">
              🎊Your payment has been received!
            </Typography>
            <Typography>
              Thank you for your payment. You have purchased the{" "}
              {selectedPlan?.name} plan. <br />
              Please check your email for a payment confirmation and invoice.
            </Typography>
            <Button
              onClick={() => router.push("/admin/login")}
              variant="contained"
              className="px-8"
              sx={{
                height: "56px",
                fontSize: "16px",
                ":hover": { opacity: "90%" },
              }}
              color="primary"
            >
              GO TO YOUR DASHBOARD
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      <>
        {plans.length > 0 && selectedPlan?.id && (
          <>
            <Box className="w-full xl:w-[60%] px-20">
              <Logo />
              {open && (
                <Dialog open={open} fullWidth maxWidth="md">
                  <DialogContent className="p-0">
                    <Box className="relative">
                      <IconX
                        size={24}
                        className=" absolute top-0 right-0 cursor-pointer z-10 "
                        onClick={() => setOpen(false)}
                      />
                    </Box>
                    <Box className="my-6">
                      <Checkout
                        shopperReference={
                          onboardingData?.user?.shopper_reference
                        }
                        total={calculateTotal()}
                        handleSubmit={handleSubmit}
                      />
                    </Box>
                  </DialogContent>
                </Dialog>
              )}
              <form onSubmit={formik.handleSubmit}>
                <Grid
                  container
                  columnSpacing={4}
                  className="rounded-lg border-2 border-gray-200 px-10 mt-4"
                >
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel required>
                      {t("first_name")}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="firstname"
                      name="firstname"
                      value={formik.values.firstname}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Type here"
                      error={
                        formik.touched.firstname &&
                        Boolean(formik.errors.firstname)
                      }
                      helperText={
                        formik.touched.firstname && formik.errors.firstname
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel required>{t("country")}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="country"
                      name="country"
                      value={formik.values.country}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Type here"
                      error={
                        formik.touched.country && Boolean(formik.errors.country)
                      }
                      helperText={
                        formik.touched.country && formik.errors.country
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel required>{t("last_name")}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="lastname"
                      name="lastname"
                      value={formik.values.lastname}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Type here"
                      error={
                        formik.touched.lastname &&
                        Boolean(formik.errors.lastname)
                      }
                      helperText={
                        formik.touched.lastname && formik.errors.lastname
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel required>{t("street")}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="street"
                      name="street"
                      value={formik.values.street}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Type here"
                      error={
                        formik.touched.street && Boolean(formik.errors.street)
                      }
                      helperText={formik.touched.street && formik.errors.street}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel required>{t("email")}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="email"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Type here"
                      error={
                        formik.touched.email && Boolean(formik.errors.email)
                      }
                      helperText={formik.touched.email && formik.errors.email}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel required>{t("city")}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="city"
                      name="city"
                      value={formik.values.city}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Type here"
                      error={formik.touched.city && Boolean(formik.errors.city)}
                      helperText={formik.touched.city && formik.errors.city}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel sx={{ color: "#666666" }}>
                      {t("business_invoice")}
                    </CustomFormLabel>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      <CustomSwitch
                        onBlur={formik.handleBlur}
                        edge="end"
                        onChange={(e) => {
                          formik.setFieldValue(
                            "business_invoice",
                            e.target.checked
                          );
                        }}
                        checked={formik.values.business_invoice}
                      />
                      <Typography sx={{ color: "#666666" }}>
                        {formik.values.business_invoice ? t("On") : t("Off")}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel required>{t("postcode")}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="postcode"
                      name="postcode"
                      value={formik.values.postcode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Type here"
                      error={
                        formik.touched.postcode &&
                        Boolean(formik.errors.postcode)
                      }
                      helperText={
                        formik.touched.postcode && formik.errors.postcode
                      }
                    />
                  </Grid>

                  {formik.values.business_invoice && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <CustomFormLabel required>{t("vat_id")}</CustomFormLabel>
                      <CustomTextField
                        fullWidth
                        id="vat_id"
                        name="vat_id"
                        value={formik.values.vat_id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Type here"
                        error={
                          formik.touched.vat_id && Boolean(formik.errors.vat_id)
                        }
                        helperText={
                          formik.touched.vat_id && formik.errors.vat_id
                        }
                      />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomFormLabel required>{t("state")}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="state"
                      name="state"
                      value={formik.values.state}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Type here"
                      error={
                        formik.touched.state && Boolean(formik.errors.state)
                      }
                      helperText={formik.touched.state && formik.errors.state}
                    />
                  </Grid>
                  <Grid size={12} className="my-4">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formik.values.terms_agreed}
                          onChange={(e) =>
                            formik.setFieldValue(
                              "terms_agreed",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label={
                        <Typography>
                          I agree to the{" "}
                          <Link
                            className="text-primary-main underline"
                            href="https://orbypos.com/terms-conditions/"
                            target="_blank"
                          >
                            Terms and Conditions
                          </Link>{" "}
                          and the{" "}
                          <Link
                            className="text-primary-main underline"
                            href="https://orbypos.com/privacy-policy/"
                            target="_blank"
                          >
                            Privacy Policy
                          </Link>
                        </Typography>
                      }
                    />
                  </Grid>
                  <Grid size={12}>
                    <Button
                      disabled={!formik.values.terms_agreed}
                      type="submit"
                      variant="contained"
                      className="w-full mb-8"
                      sx={{
                        height: "56px",
                        fontSize: "16px",
                        ":hover": { opacity: "90%" },
                      }}
                      color="primary"
                    >
                      PAY
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
            <Box className="w-full xl:w-[40%] bg-[#f9f9fa]">
              <Box className="bg-white rounded-lg border-2 border-e-gray-200 m-20 py-8 px-16 space-y-8">
                <ToggleButtonGroup
                  className="w-full"
                  color="primary"
                  value={billingModel}
                  exclusive
                  onChange={(event, newValue) => {
                    if (newValue !== null) {
                      setBillingModel(newValue);
                    }
                  }}
                >
                  <ToggleButton
                    className="w-full font-semibold"
                    value={"MONTHLY"}
                    sx={{
                      height: "52px",
                      borderColor: "#CCCCCC",
                      "&.Mui-selected": {
                        borderColor: "#2276FF",
                      },
                    }}
                  >
                    {t("monthly")}
                  </ToggleButton>
                  <ToggleButton
                    className="w-full font-semibold"
                    value={"YEARLY"}
                    sx={{
                      height: "52px",
                      borderColor: "#CCCCCC",
                      "&.Mui-selected": {
                        borderColor: "#2276FF",
                      },
                    }}
                  >
                    {t("yearly")}
                  </ToggleButton>
                </ToggleButtonGroup>

                <FormControl className="w-full">
                  <RadioGroup
                    value={selectedPlan.id}
                    onChange={(e) => {
                      setSelectedPlan(
                        plans.find((p) => p.id === e.target.value)
                      );
                    }}
                  >
                    {plans.map((p) => (
                      <Box
                        className={`border-2 ${
                          p.id === selectedPlan.id
                            ? "border-primary-main"
                            : "border-gray-300"
                        } rounded-lg flex items-center px-4 py-2 justify-between my-2`}
                      >
                        <FormControlLabel
                          sx={{
                            "& .MuiFormControlLabel-label": {
                              fontSize: "1.1rem",
                              fontWeight: "bold",
                            },
                          }}
                          value={p.id}
                          control={<Radio />}
                          label={p.name}
                        />
                        <Typography className="font-bold text-[1.1rem] flex gap-1">
                          {billingModel === "MONTHLY" ? (
                            <>
                              {p.price}€{" "}
                              <Typography className="text-sm text-[#686868] font-bold">
                                /{t("monthly")}
                              </Typography>
                            </>
                          ) : (
                            <>
                              {p.yearly_price}€{" "}
                              <Typography className="text-sm text-[#686868] font-bold">
                                /{t("yearly")}
                              </Typography>
                            </>
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </RadioGroup>
                </FormControl>

                <Box className="flex justify-between flex-wrap ">
                  <Box className="space-y-2 text-nowrap">
                    <Typography className="font-bold">
                      What's included
                    </Typography>
                    {features
                      .filter((f) =>
                        selectedPlan.subscription_feature.includes(f.id)
                      )
                      .map((f) => (
                        <Box key={f.id} className="flex items-center gap-1">
                          <IconCircleCheck className="text-primary-main" />
                          <Typography>{f.name}</Typography>
                        </Box>
                      ))}
                  </Box>

                  <Box className="space-y-2 text-nowrap">
                    <Typography className="font-bold">
                      What's not included
                    </Typography>
                    {features
                      .filter(
                        (f) => !selectedPlan.subscription_feature.includes(f.id)
                      )
                      .map((f) => (
                        <Box key={f.id} className="flex items-center gap-1">
                          <IconCircleX className="text-red-500" />
                          <Typography>{f.name}</Typography>
                        </Box>
                      ))}
                  </Box>
                </Box>

                <Divider />
                <Box className="space-y-2">
                  <Box className="flex justify-between">
                    <Typography className="font-bold text-[#686868]">
                      Sub Total
                    </Typography>
                    <Typography className="font-bold text-[#686868]">
                      {billingModel === "MONTHLY"
                        ? selectedPlan.price.toFixed(2)
                        : selectedPlan.yearly_price.toFixed(2)}
                      €
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography className="font-bold text-[#686868]">
                      VAT {vat}%
                    </Typography>
                    <Typography className="font-bold text-[#686868]">
                      {billingModel === "MONTHLY"
                        ? (selectedPlan.price * (vat / 100)).toFixed(2)
                        : (selectedPlan.yearly_price * (vat / 100)).toFixed(2)}
                      €
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography className="font-bold text-lg">Total</Typography>
                    <Typography className="font-bold text-lg">
                      {billingModel === "MONTHLY"
                        ? (
                            selectedPlan.price +
                            selectedPlan.price * (vat / 100)
                          ).toFixed(2)
                        : (
                            selectedPlan.yearly_price +
                            selectedPlan.yearly_price * (vat / 100)
                          ).toFixed(2)}
                      €
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </>
    </Box>
  );
};

export default Payment;
