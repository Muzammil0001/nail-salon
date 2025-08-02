import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import { signOut, useSession } from "next-auth/react";
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
const countryFlagEmoji = require("country-flag-emoji");
const Flag = require("react-world-flags");
import { AlertInterface, Company, LatLng } from "@/types/admin/types";
import PageContainer from "@/components/container/PageContainer";
import Loader from "@/components/loader/Loader";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import Alert from "@/components/alert/Alert";
import HorizontalStepper from "@/components/stepper/HorizontalStepper";
import currencies from "currency-formatter/currencies.json";
import * as yup from "yup";
import CustomSwitch from "@/components/forms/theme-elements/CustomSwitch";
import Image from "next/image";
import Map from "@/components/map/Map";
import { useTailwind } from "@/components/providers/TailwindProvider";
import { IconBuilding } from "@tabler/icons-react";
import CustomPhoneInput from "@/components/forms/theme-elements/CustomPhoneInput";
import CustomSelect from "@/components/forms/theme-elements/CustomSelect";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { t } from "../../../../../lib/translationHelper";
import { useSelector } from "@/store/Store";
import parsePhoneNumberFromString from "libphonenumber-js";
import { keysIn } from "lodash";

const ManageEmployee = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const defaultLocation = { lat: 45.815, lng: 15.9819 };
  const router = useRouter();
  const { setHeaderContent, setHeaderTitle } = useTailwind();
  const { data: session, status }: any = useSession({
    required: true,
  });
  const [action, setAction] = useState("create");
  const [openMapModal, setOpenMapModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertInterface | null>(null);
  const [placeholder, setPlaceholder] = useState("+1");
  const [mapCoordinates, setMapCoordinates] = useState<LatLng>(defaultLocation);
  const [uploadCheck, setUploadCheck] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const steps = [
    "basic_information",
    session?.user?.roles?.includes("SuperAdmin")
      ? "admin_information"
      : "Fiscalization",
  ];
  const [activeStep, setActiveStep] = useState(0);
  const [company, setCompany] = useState<Company>({
    company_name: "",
    company_oib: "",
    country: "",
    street: "",
    city: "",
    postcode: "",
    state: "",
    email: "",
    phone: "",
    company_currency: "",
    send_email: true,
    vat_enabled: false,
    subscription_id: null,
    billing_model: "MONTHLY",
    user: {
      email: "",
      confirm_email: "",
      username: "",
      password: "",
      confirm_password: "",
      first_name: "",
      last_name: "",
      roles: [],
      accessrights: [],
    } as any,
    fiscal_certificates: {
      certificate_name: "",
      password: "",
      base64: "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "companies_manage" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const validationSchemaCompany = yup.object({
    email: yup
      .string()
      .required("email_is_required")
      .test(
        "emp_username-exists",
        "email_already_exists",
        async (value, schema) => {
          try {
            const response = await axios.post("/api/clients/verifyemail", {
              email: value,
              id: schema.parent.id,
              action: action,
            });
            const isExist = response.data;
            return value && isExist;
          } catch (error) {
            ToastErrorMessage(error);
          }
        }
      ),
    company_name: yup
      .string()
      .min(2, "too_short")
      .max(50, "too_long")
      .required("business/company_name_is_required")
      .test(
        "emp_username-exists",
        "company_name_already_exists",
        async (value, schema) => {
          try {
            const response = await axios.post("/api/clients/verifyname", {
              company_name: value,
              id: schema.parent.id,
              action: action,
            });
            const isExist = response.data;
            return value && isExist;
          } catch (error) {
            ToastErrorMessage(error);
          }
        }
      ),
    company_oib: yup
      .string()
      .length(11, "oib_must_be_exactly_11_digits")
      .required("valid_oib_is_required_for_fiscalisation")
      .test(
        "emp_username-exists",
        "company_oib_already_exists",
        async (value, schema) => {
          try {
            const response = await axios.post("/api/clients/verifyoib", {
              company_oib: value,
              id: schema.parent.id,
              action: action,
            });
            const isExist = response.data;
            return value && isExist;
          } catch (error) {
            ToastErrorMessage(error);
          }
        }
      ),
    country: yup
      .string()
      .min(2, "too_short")
      .max(50, "too_long")
      .required("country_is_required"),
    street: yup
      .string()
      .min(2, "too_short")
      .max(100, "too_long")
      .required("street_is_required"),
    city: yup
      .string()
      .min(2, "too_short")
      .max(50, "too_long")
      .required("city_is_required"),
    postcode: yup
      .string()
      .min(2, "too_short")
      .max(50, "too_long")
      .required("postcode_is_required"),
    phone: yup
      .string()
      .required("phone_is_required")
      .test(
        "is-valid-phone",
        "Phone number must be valid and include the country code",
        (value) => {
          if (!value) return false;
          const phoneNumber = parsePhoneNumberFromString(value);
          return phoneNumber ? phoneNumber.isValid() : false;
        }
      ),
    company_currency: yup.string().required("currency_is_required"),
    subscription_id: yup.string().required("subscription_is_required"),
  });
  const validationSchemaUser = yup.object({
    user: yup.object({
      email: yup
        .string()
        .email("enter_a_valid_email")
        .required("email_is_required")
        .test(
          "emp_username-exists",
          "email_already_exists",
          async (value, schema) => {
            try {
              const response = await axios.post(
                "/api/clients/verifyuseremail",
                {
                  email: value,
                  id: schema.parent.id,
                  action: action,
                }
              );
              const isExist = response.data;
              return value && isExist;
            } catch (error) {
              ToastErrorMessage(error);
            }
          }
        ),
      confirm_email: yup
        .string()
        .email("enter_a_valid_email")
        .required("email_is_required")
        .test(
          "email-does-not-match",
          "emails_do_not_match",
          (value, schema) => {
            return schema.parent.email === value;
          }
        ),
      username: yup
        .string()
        .min(5, "too_short")
        .max(50, "too_long")
        .required("username_is_required")
        .matches(/^\S*$/, "username_no_spaces")
        .test(
          "emp_username-exists",
          "username_already_exists",
          async (value, schema) => {
            try {
              const response = await axios.post("/api/users/verifyusername", {
                username: value,
                id: schema.parent.id,
                action: action,
              });
              const isExist = response.data;
              return value && isExist;
            } catch (error) {
              ToastErrorMessage(error);
            }
          }
        ),
      first_name: yup
        .string()
        .min(2, "too_short")
        .max(50, "too_long")
        .required("first_name_is_required"),
      last_name: yup
        .string()
        .min(2, "too_short")
        .max(50, "too_long")
        .required("last_name_is_required"),
      password: yup
        .string()
        .min(8, "Password should be of minimum 8 characters length")
        .required("password_is_required"),
      confirm_password: yup
        .string()
        .required("password_is_required")
        .test(
          "password-does-not-match",
          "passwords_do_not_match",
          (value, schema) => {
            return schema.parent.password === value;
          }
        ),
    }),
  });
  const validationSchemaFiscal = yup.object({
    fiscal_certificates: yup.object({
      password: yup
        .string()
        .min(8, "Password should be of minimum 8 characters length")
        .nullable("password_is_required")
        .test("upload-check", "password_is_required", (value) => {
          if (uploadCheck && !value) return false;
          return true;
        }),
    }),
  });

  const getAddressComponent = (
    place: any,
    componentType: any,
    longNameFlag: any
  ) => {
    const addressComponents = place.address_components;

    for (let i = 0; i < addressComponents.length; i++) {
      const component = addressComponents[i];
      const types = component.types;
      if (types.indexOf(componentType) !== -1) {
        return longNameFlag ? component.long_name : component.short_name;
      }
    }

    return "";
  };
  const handleClientlocationSet = (newCoordinates: LatLng, place: any) => {
    setMapCoordinates(newCoordinates);
    formik.setFieldValue("latitude", newCoordinates.lat);
    formik.setFieldValue("longitude", newCoordinates.lng);

    if (place?.address_components) {
      const arr = [
        "landmark",
        "route",
        "neighborhood",
        "sublocality_level_2",
        "sublocality_level_1",
        "street_number",
      ];
      const address: any = [];
      for (var i = 0; i < arr.length; i++) {
        var addr = getAddressComponent(place, arr[i], true);
        if (addr != "") {
          address.push(addr);
        }
      }
      const city =
        getAddressComponent(place, "administrative_area_level_3", true) ||
        getAddressComponent(place, "administrative_area_level_2", true) ||
        getAddressComponent(place, "locality", true);
      const state = getAddressComponent(
        place,
        "administrative_area_level_1",
        true
      );
      const postCode = getAddressComponent(place, "postal_code", true);
      formik.setFieldValue(
        "street",
        address.length > 1
          ? address.slice(0, -1).join(", ") + " " + address[address.length - 1]
          : address[0]
      );
      formik.setFieldValue("city", city);
      formik.setFieldValue("postcode", postCode);
      formik.setFieldValue("state", state);
      formik.setFieldValue(
        "country",
        getAddressComponent(place, "country", true)
      );
    }
    handleClose();
  };
  const handleClose = () => {
    setOpenMapModal(false);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const fethClient = async (id: string) => {
    try {
      const response = await axios.post("/api/clients/fetchclient", {
        id,
      });
      formik.setValues(response.data);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };
  useEffect(() => {
    if (router.query.action === "view" && router.query.id) {
      setAction("view");
      fethClient(router.query.id as string);
    }

    setHeaderContent(
      <Box className="flex gap-2 items-center">
        <IconBuilding className="text-primary-main" />
        <Typography>
          / Clients /{" "}
          {router.query.action === "create" ? "Add Client" : "Edit Client"}
        </Typography>
      </Box>
    );
    setHeaderTitle("Clients");
  }, [router]);

  const formik = useFormik({
    initialValues: company,
    validationSchema:
      activeStep == 0
        ? validationSchemaCompany
        : session?.user?.roles?.includes("SuperAdmin")
          ? validationSchemaUser
          : validationSchemaFiscal,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      let url = "/api/clients/addclient";
      if (action == "view") {
        url = "/api/clients/updateclient";
      }
      const manageCompany = async () => {
        if (activeStep < steps.length - 1) {
          formik.setTouched({});
          return setActiveStep((prev) => prev + 1);
        }

        try {
          setLoading(true);
          const response = await axios.post(url, { ...values, uploadCheck });
          if (response.status == 201) {
            ToastSuccessMessage(
              response?.data?.message || t("client_created_successfully", keys)
            );
            router.push("/admin/clients");
          } else if (response.status === 200) {
            ToastSuccessMessage(
              response?.data?.message || t("client_updated_successfully", keys)
            );
            router.push("/admin/clients");
          }
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      };
      manageCompany();
    },
  });

  
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/subscription/getsubscriptions");
        setSubscriptions(response.data);
      } catch (error) {
        console.error("Error while fetching subscriptions", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/clients")) {
      signOut({ redirect: true, callbackUrl: "/admin/login" });
    }
  }, [session]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/subscription/getsubscriptions");
        setSubscriptions(response.data);
      } catch (error) {
        console.error("Error while fetching subscriptions", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCountryChange = (country: any | undefined) => {
    const countryCode = country ? `+${getCountryCallingCode(country)}` : "";
    setPlaceholder(countryCode);
  };
  return (
    <PageContainer
      topbar={
        <HorizontalStepper
          steps={steps}
          activeStep={activeStep}
          onStepClick={handleStepClick}
        />
      }
    >
      <Loader loading={loading} />
      <Alert alert={alert} />
      <form encType="multipart/form-data" onSubmit={formik.handleSubmit}>
        {session && session?.user?.navigation?.includes("/clients") ? (
          <Box mt={1} sx={{ overflowX: "hidden" }}>
            {activeStep === 0 && (
              <Grid container spacing={4} columns={{ xs: 4, lg: 8 }}>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>
                      {t("company_name", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="company_name"
                      name="company_name"
                      value={formik.values.company_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.company_name &&
                        formik.errors.company_name
                      }
                      helperText={
                        formik.touched.company_name &&
                        formik.errors.company_name &&
                        t(formik.errors.company_name as string, keys)
                      }
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>{t("oib", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="company_oib"
                      name="company_oib"
                      value={formik.values.company_oib}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.company_oib &&
                        Boolean(formik.errors.company_oib)
                      }
                      helperText={
                        formik.touched.company_oib &&
                        formik.errors.company_oib &&
                        t(formik.errors.company_oib as string, keys)
                      }
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>{t("country", keys)}</CustomFormLabel>
                    <FormControl
                      fullWidth
                      error={
                        formik.touched.country && Boolean(formik.errors.country)
                      }
                    >
                      <Autocomplete
                        id="combo-box-demo"
                        options={countryFlagEmoji.list}
                        value={
                          countryFlagEmoji.list.find(
                            (option: Record<string, any>) =>
                              option.name === formik.values.country
                          ) || null
                        }
                        getOptionLabel={(option) => option.name}
                        onChange={(event, newValue) => {
                          formik.setFieldValue(
                            "country",
                            newValue ? newValue.name : ""
                          );
                        }}
                        onBlur={() => formik.setFieldTouched("country", true)}
                        renderInput={(params) => (
                          <CustomTextField
                            placeholder={t("choose_country", keys)}
                            {...params}
                            fullWidth
                          />
                        )}
                        renderOption={(props, option) => (
                          <MenuItem {...props} key={option.name}>
                            {option.name}
                          </MenuItem>
                        )}
                      />

                      {formik.touched.country && formik.errors.country && (
                        <FormHelperText>
                          {t((formik.errors as any)?.country as string, keys)}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>{t("street", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="street"
                      name="street"
                      value={formik.values.street}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.street && Boolean(formik.errors.street)
                      }
                      helperText={formik.touched.street && t(formik.errors.street as string, keys)}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 2 }}>
                  <Box>
                    <CustomFormLabel>{t("select_location", keys)}</CustomFormLabel>
                    <Button
                      variant="outlined"
                      onClick={() => setOpenMapModal(true)}
                    >
                      <Image
                        src={"/img/map.png"}
                        width={25}
                        height={25}
                        alt=""
                      />
                    </Button>
                    {openMapModal && (
                      <Map
                        initialValue={mapCoordinates}
                        open={openMapModal}
                        setMapCoordinates={handleClientlocationSet}
                        handleClose={() => setOpenMapModal(false)}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>{t("city", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="city"
                      name="city"
                      value={formik.values.city}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={formik.touched.city && Boolean(formik.errors.city)}
                      helperText={formik.touched.city && t(formik.errors.city as string, keys)}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>{t("postcode", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="postcode"
                      name="postcode"
                      value={formik.values.postcode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.postcode &&
                        Boolean(formik.errors.postcode)
                      }
                      helperText={
                        formik.touched.postcode && t(formik.errors.postcode as string, keys)
                      }
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel>{t("state", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="state"
                      name="state"
                      value={formik.values.state}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.state && Boolean(formik.errors.state)
                      }
                      helperText={formik.touched.state && t(formik.errors.state as string, keys)}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>{t("email", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="email"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.email && Boolean(formik.errors.email)
                      }
                      helperText={formik.touched.email && t(formik.errors.email as string, keys)}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <style>
                      {`
                      .custom-phone-input .PhoneInputCountry {
                        margin-right: 0 !important;
                        border-radius: 7px 0 0 7px !important;
                        border-right: 0 !important;
                      }
                      .custom-phone-input .PhoneInputInput {
                        border-radius: 0 7px 7px 0 !important;
                      }
                    `}
                    </style>
                    <CustomFormLabel required>
                      {t("phone_number", keys)}
                    </CustomFormLabel>
                    <CustomPhoneInput
                      className="custom-phone-input"
                      defaultCountry="US"
                      id="mobile"
                      placeholder={placeholder}
                      label="location_phone Number"
                      value={formik.values.phone as any}
                      onChange={(phone: any) =>
                        formik.setFieldValue("phone", phone)
                      }
                      onBlur={() => formik.setFieldTouched("phone", true)}
                      onCountryChange={(c: any) => handleCountryChange(c)}
                    />
                    {formik.touched.phone && formik.errors.phone ? (
                      <Typography variant="body2" color="error">
                        {typeof formik.errors.phone === "string"
                          ? t(formik.errors.phone, keys)
                          : ""}
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>{t("currency", keys)}</CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={formik.values.company_currency}
                      onChange={(e: any) =>
                        formik.setFieldValue("company_currency", e.target.value)
                      }
                      onBlur={() =>
                        formik.setFieldTouched("company_currency", true)
                      }
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        {t("choose_currency", keys)}
                      </MenuItem>
                      {Object.values(currencies)
                        .filter((c) => ["EUR", "DKK"].includes(c.code))
                        .map((c) => (
                          <MenuItem
                            value={c.code}
                            key={c.code}
                          >{`${c.code} (${c.symbol})`}</MenuItem>
                        ))}
                    </CustomSelect>
                    {formik.touched.company_currency &&
                      formik.errors.company_currency ? (
                      <Typography variant="body2" color="error">
                        {typeof formik.errors.company_currency === "string"
                          ? t(formik.errors.company_currency, keys)
                          : ""}
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <FormControl fullWidth>
                      <CustomFormLabel required>
                        {t("subscription", keys)}
                      </CustomFormLabel>
                      <CustomSelect
                        name="subscription_id"
                        value={formik.values.subscription_id}
                        onChange={formik.handleChange}
                        displayEmpty
                      >
                        <MenuItem
                          sx={{ color: "gray", fontStyle: "italic" }}
                          value={null as any}
                        >
                          {t("choose_subscription", keys)}
                        </MenuItem>
                        {subscriptions.map((s: any) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </CustomSelect>
                      {formik.touched.subscription_id &&
                        formik.errors.subscription_id && (
                          <Typography variant="body2" color="error">
                            {t(formik.errors.subscription_id as string, keys)}
                          </Typography>
                        )}
                    </FormControl>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box className="flex items-center gap-2 mt-12">
                    <Typography>{t("monthly", keys)}</Typography>
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formik.values.billing_model === "YEARLY"}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            formik.setFieldValue(
                              "billing_model",
                              e.target.checked ? "YEARLY" : "MONTHLY"
                            )
                          }
                        />
                      }
                      label={t("yearly", keys)}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formik.values.vat_enabled}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            formik.setFieldValue(
                              "vat_enabled",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label={t("in_vat_system", keys)}
                    />
                  </Box>
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <>
                {session?.user?.roles?.includes("SuperAdmin") && (
                  <Grid container spacing={4} columns={{ xs: 4, lg: 8 }}>
                    <Grid size={{ xs: 12, lg: 3 }}>
                      <Box>
                        <CustomFormLabel required>
                          {t("first_name", keys)}
                        </CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          id="user.first_name"
                          name="user.first_name"
                          value={formik.values.user.first_name}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder={t("type_here", keys)}
                          error={
                            formik.touched?.user?.first_name &&
                            Boolean(formik.errors?.user?.first_name)
                          }
                          helperText={
                            formik.touched?.user?.first_name &&
                            t(formik.errors?.user?.first_name as string, keys)
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 3 }}>
                      <Box>
                        <CustomFormLabel required>
                          {t("last_name", keys)}
                        </CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          id="user.last_name"
                          name="user.last_name"
                          value={formik.values.user.last_name}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder={t("type_here", keys)}
                          error={
                            formik.touched?.user?.last_name &&
                            Boolean(formik.errors?.user?.last_name)
                          }
                          helperText={
                            formik.touched?.user?.last_name &&
                            t(formik.errors?.user?.last_name as string, keys)
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 3 }}>
                      <Box>
                        <CustomFormLabel required>{t("email", keys)}</CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          id="user.email"
                          name="user.email"
                          value={formik.values.user.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder={t("type_here", keys)}
                          error={
                            formik.touched?.user?.email &&
                            Boolean(formik.errors?.user?.email)
                          }
                          helperText={
                            formik.touched?.user?.email &&
                            t(formik.errors?.user?.email as string, keys)
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 3 }}>
                      <Box>
                        <CustomFormLabel required>
                          {t("confirm_email", keys)}
                        </CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          id="user.confirm_email"
                          name="user.confirm_email"
                          value={formik.values.user.confirm_email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder={t("type_here", keys)}
                          error={
                            formik.touched?.user?.confirm_email &&
                            Boolean(formik.errors?.user?.confirm_email)
                          }
                          helperText={
                            formik.touched?.user?.confirm_email &&
                            t(formik.errors?.user?.confirm_email as string, keys)
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 3 }}>
                      <Box>
                        <CustomFormLabel required>
                          {t("username", keys)}
                        </CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          id="user.username"
                          name="user.username"
                          value={formik.values.user.username}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder={t("type_here", keys)}
                          error={
                            formik.touched?.user?.username &&
                            Boolean(formik.errors?.user?.username)
                          }
                          helperText={
                            formik.touched?.user?.username &&
                            t(formik.errors?.user?.username as string, keys)
                          }
                        />
                      </Box>
                    </Grid>
                    {action === "create" && (
                      <>
                        {" "}
                        <Grid size={{ xs: 12, lg: 3 }}>
                          <Box>
                            <CustomFormLabel required>
                              {t("password", keys)}
                            </CustomFormLabel>
                            <CustomTextField
                              type="password"
                              fullWidth
                              id="user.password"
                              name="user.password"
                              value={formik.values.user.password}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              placeholder={t("type_here", keys)}
                              error={
                                formik.touched?.user?.password &&
                                Boolean(formik.errors?.user?.password)
                              }
                              helperText={
                                formik.touched?.user?.password &&
                                t(formik.errors?.user?.password as string, keys)
                              }
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, lg: 3 }}>
                          <Box>
                            <CustomFormLabel required>
                              {t("confirm_password", keys)}
                            </CustomFormLabel>
                            <CustomTextField
                              type="password"
                              fullWidth
                              id="user.confirm_password"
                              name="user.confirm_password"
                              value={formik.values.user.confirm_password}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              placeholder={t("type_here", keys)}
                              error={
                                formik.touched?.user?.confirm_password &&
                                Boolean(formik.errors?.user?.confirm_password)
                              }
                              helperText={
                                formik.touched?.user?.confirm_password &&
                                t(formik.errors?.user?.confirm_password as string, keys)
                              }
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, lg: 3 }}>
                          <Box>
                            <FormControl fullWidth>
                              <CustomFormLabel required>
                                {t("subscription", keys)}
                              </CustomFormLabel>
                              <CustomSelect
                                name="subscription_id"
                                value={formik.values.subscription_id}
                                onChange={formik.handleChange}
                                displayEmpty
                              >
                                <MenuItem
                                  sx={{ color: "gray", fontStyle: "italic" }}
                                  value={null as any}
                                >
                                  {t("choose_subscription", keys)}
                                </MenuItem>
                                {subscriptions.map((s: any) => (
                                  <MenuItem key={s.id} value={s.id}>
                                    {s.name}
                                  </MenuItem>
                                ))}
                              </CustomSelect>
                              {formik.touched.subscription_id &&
                                formik.errors.subscription_id && (
                                  <Typography variant="body2" color="error">
                                    {t(formik.errors.subscription_id as string, keys)}
                                  </Typography>
                                )}
                            </FormControl>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, lg: 3 }}>
                          <Box className="flex items-center gap-4 mt-12">
                            <Typography>{t("monthly", keys)}</Typography>
                            <FormControlLabel
                              control={
                                <CustomSwitch
                                  checked={formik.values.billing_model === "YEARLY"}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    formik.setFieldValue(
                                      "billing_model",
                                      e.target.checked ? "YEARLY" : "MONTHLY"
                                    )
                                  }
                                />
                              }
                              label={t("yearly", keys)}
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, lg: 3 }}></Grid>
                  
                      </>
                    )}
                  </Grid>
                )}
              </>
            )}
          </Box>
        ) : (
          ""
        )}

        <Box className="flex justify-end gap-4 mt-4">
          <>
            {activeStep > 0 && (
              <Button
                sx={{ width: "172px", height: "56px", fontSize: "16px" }}
                onClick={() => setActiveStep((prev) => prev - 1)}
                variant="outlined"
                type="button"
              >
                {t("back", keys)}
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button
                variant="outlined"
                type="submit"
                sx={{ width: "172px", height: "56px", fontSize: "16px" }}
              >
                {t("next", keys)}
              </Button>
            ) : (
              <Button
                variant="contained"
                type="submit"
                sx={{ width: "172px", height: "56px", fontSize: "16px" }}
              >
                {action === "create" ? t("save", keys) : t("update", keys)}
              </Button>
            )}
          </>
        </Box>
      </form>
    </PageContainer>
  );
};

export default ManageEmployee;
