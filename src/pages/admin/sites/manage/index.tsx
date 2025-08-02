import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  Box,
  FormHelperText,
  Autocomplete,
  Typography,
  FormControlLabel,
} from "@mui/material";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import Flag from "react-world-flags";
import AddIcon from "@mui/icons-material/Add";
import PageContainer from "@/components/container/PageContainer";
import HorizontalStepper from "@/components/stepper/HorizontalStepper";
import { AccessRights2, AlertInterface, LatLng } from "@/types/admin/types";
import Loader from "@/components/loader/Loader";
import Alert from "@/components/alert/Alert";
import Grid from "@mui/material/Grid2";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import { t } from "../../../../../lib/translationHelper";
import Image from "next/image";
import Map from "@/components/map/Map";
const countryFlagEmoji = require("country-flag-emoji");
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import CustomSwitch from "@/components/switches/CustomSwitch";
import { IconBuilding } from "@tabler/icons-react";
import { useTailwind } from "@/components/providers/TailwindProvider";
import moment from "moment-timezone";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import CustomSelect from "@/components/forms/theme-elements/CustomSelect";
import CustomPhoneInput from "@/components/forms/theme-elements/CustomPhoneInput";
import { DEFAULT_SCHEDULE_DAYS, SCHEDULE_TABLE_HEADINGS } from "@/constants";
import { TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import currencies from "currency-formatter/currencies.json";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { getScheduleForDays } from "@/helpers/getScheduleForDay";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { checkAccess } from "../../../../../lib/clientExtras";
import { useSelector } from "@/store/Store";

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

const ManageSites = () => {
  const defaultLocation = { lat: 37.0902, lng: -95.7129 };
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const router = useRouter();
  const { data: session }: any = useSession();
  const { setHeaderContent, setHeaderTitle } = useTailwind();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("create");
  const [alert, setAlert] = useState<AlertInterface | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [openMapModal, setOpenMapModal] = useState(false);
  const [languages, setLanguages] = useState<any[]>([]);
  const [countryList, setCountryList] = useState<any>([]);
  const [placeholder, setPlaceholder] = useState("+1");
  const [mapCoordinates, setMapCoordinates] = useState<LatLng>(defaultLocation);
  const timezones = moment.tz.names();
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const steps = [t("basic_information", keys), t("working_hours", keys)];
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "locations_manage" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const validationSchema = Yup.object({
    location_name: Yup.string().required(t("location_name_is_required", keys)),
    location_number: Yup.string().required(
      t("location_number_is_required", keys)
    ),
    client_id: Yup.string().required(t("user_is_required", keys)),
    country: Yup.string().required(t("country_is_required", keys)),
    street: Yup.string().required(t("street_is_required", keys)),
    city: Yup.string().required(t("city_is_required", keys)),
    postcode: Yup.string().required(t("postcode_is_required", keys)),
    latitude: Yup.number()
      .required(t("latitude_is_required", keys))
      .min(-90, t("latitude_must_be_greater_than_or_equal_to_-90", keys))
      .max(90, t("latitude_must_be_less_than_or_equal_to_90", keys)),
    longitude: Yup.number()
      .required(t("longitude_is_required", keys))
      .min(-180, t("longitude_must_be_greater_than_or_equal_to_-180", keys))
      .max(180, t("longitude_must_be_less_than_or_equal_to_180", keys)),
    state: Yup.string(),
    location_email: Yup.string()
      .email(t("invalid_email", keys))
      .required(t("email_is_required", keys)),
    location_phone: Yup.string()
      .required(t("phone_is_required", keys))
      .test(
        "is_valid_phone",
        t("phone_number_must_be_valid_and_include_the_country_code", keys),
        (value) => {
          if (!value) return false;
          const phone_number = parsePhoneNumberFromString(value);
          return phone_number ? phone_number.isValid() : false;
        }
      ),
    language_id: Yup.string().required(t("language_is_required", keys)),
    location_timezone: Yup.string().required(t("time_zone_is_required", keys)),
    location_currency: Yup.string().required("currency_is_required"),
    location_24_hours: Yup.string().required(
      t("location_24_hours_is_required", keys)
    ),
  });

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };
  session?.user;

  const formik = useFormik({
    initialValues: {
      location_name: "",
      location_number: "",
      country: "",
      street: "",
      city: "",
      postcode: "",
      state: "",
      client_id: null,
      location_email: "",
      location_phone: "",
      language_id: null,
      location_currency: "USD",
      send_email: true,
      location_timezone: "America/New_York",
      location_24_hours: "24-hours",
      days: DEFAULT_SCHEDULE_DAYS,
      latitude: null,
      longitude: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      const { latitude, longitude } = values;
      
      const allValues = {
        ...values,
        longitude: String(longitude),
        latitude: String(latitude),
      };
      if (action === "create") {
        try {
          setLoading(true);
          const response = await axios.post(
            "/api/sites/createlocation",
            allValues
          );
          if (response.status === 201) {
            ToastSuccessMessage(
              t(response?.data?.message, keys) || t("created!", keys)
            );
            setTimeout(() => {
              window.location.href = "/admin/sites";
            }, 1500);
          }
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      } else if (action === "view" && allValues) {
        try {
          setLoading(true);
          const response = await axios.post("/api/sites/editlocation", {
            ...allValues,
            id: router.query.id,
          });
          if (response.status === 200) {
            ToastSuccessMessage(
              t(response?.data?.message, keys) || t("updated!", keys)
            );
            setTimeout(() => {
              window.location.href = "/admin/sites";
            }, 1500);
          }
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      }
    },
  });

  useEffect(() => {
  const fetchClients= async ()=>{
    try {
      const response = await axios.post("/api/clients/fetchclients", {fetchAll:true} );
      if(response.status === 200){
        setUsers(response.data.clients);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  }
  fetchClients();
  }, [])

  const fetchLocation = async (id: string) => {
    try {
      const response = await axios.post("/api/sites/getsinglelocation", {
        id,
      });
      const locationData = response.data;

      const updatedDays = getScheduleForDays(locationData.days);

      formik.setValues({
        ...locationData,
        days: updatedDays,
        language_id: locationData.language_id,
      });
    } catch (error) {
      console.error("Failed to fetch location data:", error);
    }
  };

  useEffect(() => {
    setCountryList(countryFlagEmoji.list);
  }, []);
  // formik.setValues({ ...locationData, days: updatedDays });

  useEffect(() => {
    if (router.query.action === "view" && router.query.id) {
      setAction("view");
      fetchLocation(router.query.id as string);
    }

    setHeaderContent(
      <Box className="flex gap-2 items-center">
        <IconBuilding className="text-primary-main" />
        <Typography>
          / Locations /{" "}
          {router.query.action === "create" ? "Add Site" : "Edit Site"}
        </Typography>
      </Box>
    );
    setHeaderTitle("Sites");
  }, []);

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

  const addNewTimeSlot = (dayIndex: number) => {
    const newTimeSlot = {
      schedule_from: "",
      schedule_to: "",
      schedule_enabled: false,
      isNew: true,
    };
    const updatedDays = [...formik.values.days];
    updatedDays[dayIndex].timeSlots.push(newTimeSlot);
    formik.setFieldValue("days", updatedDays);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const updatedDays = [...formik.values.days];
    updatedDays[dayIndex].timeSlots.splice(slotIndex, 1);
    formik.setFieldValue("days", updatedDays);
  };

  const handleClose = () => {
    setOpenMapModal(false);
  };

  const fetchLanguages = async () => {
    try {
      const response = await axios.get("/api/languages/getlanguages");
      setLanguages(response.data);
    } catch (error) {
      console.error("Failed to fetch languages:", error);
      setLanguages([]);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleCountryChange = (country: any | undefined) => {
    const countryCode = country ? `+${getCountryCallingCode(country)}` : "";
    setPlaceholder(countryCode);
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeStep === 0) {
        await validationSchema.validate(formik.values, { abortEarly: false });
      }

      if (!Object.keys(formik.errors).length) {
        setActiveStep((prev) => prev + 1);
      }
    } catch (validationError) {
      if (validationError instanceof Yup.ValidationError) {
        const errors: Record<string, string> = {};
        const touchedFields: Record<string, boolean> = {};

        validationError.inner.forEach((err) => {
          const errPath = err.path as string;

          if (errPath && err.message) {
            errors[errPath] = err.message;
            touchedFields[errPath] = true;
          }
        });

        formik.setErrors(errors);
        formik.setTouched(touchedFields);
      } else {
        console.error("Unexpected validation error", validationError);
      }
    }
  };

  useEffect(() => {
    if (
      session &&
      !session?.user?.navigation?.includes("/admin/sites")
    ) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <>
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
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            {activeStep === 0 && (
              <Grid container spacing={4} columns={{ xs: 4, lg: 8 }}>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>
                      {t("location_name", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="location_name"
                      name="location_name"
                      value={formik.values.location_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      sx={{
                        "& .MuiInputBase-input": {
                          textTransform: "capitalize",
                        },
                      }}
                      error={
                        formik.touched.location_name &&
                        formik.errors.location_name
                      }
                      helperText={
                        formik.touched.location_name &&
                        formik.errors.location_name
                      }
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>
                      {t("location_number", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="location_number"
                      name="location_number"
                      value={formik.values.location_number}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.location_number &&
                        Boolean(formik.errors.location_number)
                      }
                      helperText={
                        formik.touched.location_number &&
                        formik.errors.location_number
                      }
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>
                      {t("country", keys)}
                    </CustomFormLabel>
                    <FormControl
                      fullWidth
                      error={
                        formik.touched.country &&
                        Boolean(formik.errors.country)
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
                            {...params}
                            placeholder={t("select_country", keys)}
                            fullWidth
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: formik.values.country ? (
                                <Flag
                                  code={
                                    countryFlagEmoji.list.find(
                                      (option: any) =>
                                        option.name === formik.values.country
                                    )?.code
                                  }
                                  style={{
                                    height: "15px",
                                    marginRight: "8px",
                                  }}
                                />
                              ) : null,
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Flag
                              code={option.code}
                              style={{
                                height: "15px",
                                marginRight: "8px",
                              }}
                            />
                            {option.name}
                          </li>
                        )}
                      />

                      {formik.touched.country && formik.errors.country && (
                        <FormHelperText>
                          {String(formik.errors.country)}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>
                      {t("street", keys)}
                    </CustomFormLabel>
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
                      helperText={
                        formik.touched.street && formik.errors.street
                      }
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 2 }}>
                  <Box>
                    <CustomFormLabel>
                      {t("select_location", keys)}
                    </CustomFormLabel>
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
                    <CustomFormLabel required>
                      {t("city", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="city"
                      name="city"
                      value={formik.values.city}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.city && Boolean(formik.errors.city)
                      }
                      helperText={formik.touched.city && formik.errors.city}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>
                      {t("postcode", keys)}
                    </CustomFormLabel>
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
                        formik.touched.postcode && formik.errors.postcode
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
                      helperText={formik.touched.state && formik.errors.state}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }} container spacing={2}>
                  <Grid size={{ xs: 12, lg: 4 }}>
                    <CustomFormLabel required>
                      {t("latitude", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="latitude"
                      name="latitude"
                      type="number"
                      value={formik.values.latitude}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.latitude &&
                        Boolean(formik.errors.latitude)
                      }
                      helperText={
                        formik.touched.latitude && formik.errors.latitude
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, lg: 4 }}>
                    <CustomFormLabel required>
                      {t("longitude", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="longitude"
                      name="longitude"
                      type="number"
                      value={formik.values.longitude}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.longitude &&
                        Boolean(formik.errors.longitude)
                      }
                      helperText={
                        formik.touched.longitude && formik.errors.longitude
                      }
                    />
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>
                      {t("email", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="location_email"
                      name="location_email"
                      value={formik.values.location_email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.location_email &&
                        Boolean(formik.errors.location_email)
                      }
                      helperText={
                        formik.touched.location_email &&
                        formik.errors.location_email
                      }
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
                 border:1px solid light-gray;
                border-right: 0 !important;
              }
              .custom-phone-input .PhoneInputInput {
                border:1px solid light-gray;
                
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
                      value={formik.values.location_phone as any}
                      onChange={(location_phone: any) =>
                        formik.setFieldValue("location_phone", location_phone)
                      }
                      onBlur={() =>
                        formik.setFieldTouched("location_phone", true)
                      }
                      onCountryChange={(c: any) => handleCountryChange(c)}
                    />
                    {formik.touched.location_phone &&
                      formik.errors.location_phone ? (
                      <Typography variant="body2" color="error">
                        {typeof formik.errors.location_phone === "string"
                          ? formik.errors.location_phone
                          : ""}
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>
                      {t("language", keys)}
                    </CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      labelId="demo-simple-select-label"
                      id="language_id"
                      value={formik.values.language_id}
                      displayEmpty
                      onChange={(e: any) =>
                        formik.setFieldValue("language_id", e.target.value)
                      }
                      onBlur={() =>
                        formik.setFieldTouched("language_id", true)
                      }
                      renderValue={(selected: any) => {
                        if (!selected) {
                          return (
                            <span style={{ color: "#aaa" }}>
                              {t("select_language", keys)}
                            </span>
                          );
                        }
                        return (
                          languages.find((lang: any) => lang.id === selected)
                            ?.language_name || ""
                        );
                      }}
                    >
                      <MenuItem value="" disabled>
                        {t("select_language", keys)}
                      </MenuItem>
                      {languages.map((language: any) => (
                        <MenuItem key={language.id} value={language.id}>
                          {language.language_name}
                        </MenuItem>
                      ))}
                    </CustomSelect>

                    {formik.touched.language_id &&
                      formik.errors.language_id ? (
                      <Typography variant="body2" color="error">
                        {formik.errors.language_id}
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
                      name="location_currency"
                      value={formik.values.location_currency || 'USD'}
                      onChange={(e: any) =>
                        formik.setFieldValue("location_currency", e.target.value)
                      }
                      onBlur={() =>
                        formik.setFieldTouched("location_currency", true)
                      }
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        {t("choose_currency", keys)}
                      </MenuItem>
                      {Object.values(currencies)
                        .filter((c) => ["USD", "EUR", "DKK"].includes(c.code))
                        .map((c) => (
                          <MenuItem
                            value={c.code}
                            key={c.code}
                            selected={c.code === "USD"}
                          >{`${c.code} (${c.symbol})`}</MenuItem>
                        ))}
                    </CustomSelect>
                    {formik.touched.location_currency &&
                      formik.errors.location_currency ? (
                      <Typography variant="body2" color="error">
                        {typeof formik.errors.location_currency === "string"
                          ? t(formik.errors.location_currency, keys)
                          : ""}
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel required>{t("select_user", keys)}</CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      name="client_id"
                      value={formik.values.client_id || ''}
                      onChange={(e: any) =>
                        formik.setFieldValue("client_id", e.target.value)
                      }
                      onBlur={() =>
                        formik.setFieldTouched("client_id", true)
                      }
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        {t("select_user", keys)}
                      </MenuItem>
                      {users.map((user: any) => (
                        <MenuItem
                          value={user.id}
                          key={user.id}
                          selected={user.id === "USD"}
                        >{`${user.first_name} ${user.last_name}`}</MenuItem>
                      ))}
                    </CustomSelect>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }}>
                  <Box>
                    <CustomFormLabel>{t("send_activation_email", keys)}</CustomFormLabel>
                    <CustomSwitch
                      checked={formik.values.send_email}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        formik.setFieldValue(
                          "send_email",
                          e.target.checked
                        )
                      }
                    />
                  </Box>
                </Grid>
              </Grid>
            )}
            {activeStep === 1 && (
              <Box>
                <Grid container spacing={4} columns={{ xs: 12 }}>
                  <Grid size={{ xs: 12, xl: 6 }}>
                    <Box
                      sx={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          marginBottom: 2,
                          padding: 2,
                        }}
                      >
                        <FormControl fullWidth>
                          <CustomFormLabel children={t("time_zone", keys)} />
                          <CustomSelect
                            labelId="location-timezone-label"
                            name="location_timezone"
                            value={formik.values.location_timezone}
                            onChange={formik.handleChange}
                            error={
                              formik.touched.location_timezone &&
                              Boolean(formik.errors.location_timezone)
                            }
                          >
                            {timezones.map((zone) => (
                              <MenuItem key={zone} value={zone}>
                                {zone}
                              </MenuItem>
                            ))}
                          </CustomSelect>
                        </FormControl>

                        <FormControl fullWidth>
                          <CustomFormLabel
                            children={t("time_format", keys)}
                          />
                          <CustomSelect
                            labelId="is_24_hours-label"
                            name="location_24_hours"
                            value={formik.values.location_24_hours}
                            onChange={formik.handleChange}
                          >
                            <MenuItem value="24-hours">
                              {t("24_hours", keys)}
                            </MenuItem>
                            <MenuItem value="12-hours">
                              {t("12_hours", keys)}
                            </MenuItem>
                          </CustomSelect>
                        </FormControl>
                      </Box>

                      <FieldArray name="days">
                        {() => (
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  {SCHEDULE_TABLE_HEADINGS.filter((h => h !== "time_slot")).map(
                                    (header, index) => (
                                      <TableCell
                                        key={index}
                                        sx={{
                                          boxShadow:
                                            "rgba(0, 0, 0, 0.03) 7px 0 10px inset !important",
                                          textAlign: "left",
                                          padding: "12px 8px",
                                          fontSize: "14px",
                                        }}
                                      >
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight="700"
                                          sx={{
                                            textWrap: "nowrap",
                                            fontSize: "14px",
                                            color: "#646464",
                                            textTransform: "capitalize",
                                            textAlign:
                                              header === "time_slot"
                                                ? "center"
                                                : "left",
                                          }}
                                        >
                                          {t(header, keys)}
                                        </Typography>
                                      </TableCell>
                                    )
                                  )}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {formik.values.days?.map((day, dayIndex) => (
                                  <React.Fragment key={day.id}>
                                    {day.timeSlots &&
                                      Array.isArray(day.timeSlots) &&
                                      day.timeSlots.map((slot, slotIndex) => (
                                        <TableRow key={slotIndex}>
                                          {slotIndex === 0 && (
                                            <TableCell
                                              rowSpan={day.timeSlots.length}
                                              sx={{
                                                boxShadow:
                                                  "rgba(0, 0, 0, 0.03) 7px 0 10px inset !important",
                                                textAlign: "left",
                                                padding: "12px 8px",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: "14px",
                                                  color: "#646464",
                                                  textWrap: "nowrap",
                                                  textTransform: "capitalize",
                                                }}
                                              >
                                                {t(day.name, keys)}
                                              </Typography>
                                            </TableCell>
                                          )}

                                          <TableCell
                                            sx={{
                                              boxShadow:
                                                "rgba(0, 0, 0, 0.03) 7px 0 10px inset !important",
                                              textAlign: "center",
                                              padding: "12px 8px",
                                            }}
                                          >
                                            <TimePicker
                                              value={
                                                slot.schedule_from
                                                  ? dayjs(
                                                    slot.schedule_from,
                                                    "HH:mm"
                                                  )
                                                  : null
                                              }
                                              onChange={(newValue: any) => {
                                                const formattedValue = newValue?.format(
                                                  "HH:mm"
                                                );
                                                formik.setFieldValue(
                                                  `days[${dayIndex}].timeSlots[${slotIndex}].schedule_from`,
                                                  formattedValue
                                                );
                                              }}
                                              minutesStep={1}
                                              slots={{
                                                textField: TextField,
                                                openPickerIcon: () => (
                                                  <AccessTimeIcon
                                                    sx={{
                                                      fontSize: "14px",
                                                    }}
                                                  />
                                                ),
                                              }}
                                              slotProps={{
                                                textField: {
                                                  size: "small",
                                                  fullWidth: true,
                                                  sx: {
                                                    width: "155px",
                                                    height: "40px",
                                                    gap: "10px",
                                                    border: "none",
                                                    "& input": {
                                                      padding: "6px 10px",
                                                      fontSize: "14px",
                                                    },
                                                  },
                                                },
                                              }}
                                              ampm={
                                                formik.values
                                                  .location_24_hours ===
                                                "12-hours"
                                              }
                                            />
                                          </TableCell>

                                          <TableCell
                                            sx={{
                                              boxShadow:
                                                "rgba(0, 0, 0, 0.03) 7px 0 10px inset !important",
                                              textAlign: "center",
                                              padding: "12px 8px",
                                            }}
                                          >
                                            <TimePicker
                                              value={
                                                slot.schedule_to
                                                  ? dayjs(
                                                    slot.schedule_to,
                                                    "HH:mm"
                                                  )
                                                  : null
                                              }
                                              onChange={(newValue: any) => {
                                                const formattedValue = newValue?.format(
                                                  "HH:mm"
                                                );
                                                formik.setFieldValue(
                                                  `days[${dayIndex}].timeSlots[${slotIndex}].schedule_to`,
                                                  formattedValue
                                                );
                                              }}
                                              ampm={
                                                formik.values
                                                  .location_24_hours ===
                                                "12-hours"
                                              }
                                              slots={{
                                                textField: TextField,
                                                openPickerIcon: () => (
                                                  <AccessTimeIcon
                                                    sx={{
                                                      fontSize: "14px",
                                                    }}
                                                  />
                                                ),
                                              }}
                                              slotProps={{
                                                textField: {
                                                  size: "small",
                                                  fullWidth: true,
                                                  sx: {
                                                    width: "155px",
                                                    height: "40px",
                                                    gap: "10px",
                                                    border: "none",
                                                    "& input": {
                                                      padding: "6px 10px",
                                                      fontSize: "14px",
                                                    },
                                                  },
                                                },
                                              }}
                                            />
                                          </TableCell>

                                          <TableCell
                                            sx={{
                                              boxShadow:
                                                "rgba(0, 0, 0, 0.03) 7px 0 10px inset !important",
                                              textAlign: "center",
                                              padding: "12px 8px",
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "14px",
                                              }}
                                            >
                                              <CustomSwitch
                                                name={`days[${dayIndex}].timeSlots[${slotIndex}].schedule_enabled`}
                                                checked={
                                                  slot.schedule_enabled
                                                }
                                                onChange={formik.handleChange}
                                              />
                                              <Typography
                                                sx={{
                                                  color: "#666666",
                                                }}
                                              >
                                                {slot.schedule_enabled
                                                  ? t("on", keys)
                                                  : t("off", keys)}
                                              </Typography>
                                            </Box>
                                          </TableCell>

                                          {/* <TableCell
                                            sx={{
                                              boxShadow:
                                                "rgba(0, 0, 0, 0.03) 7px 0 10px inset !important",
                                              textAlign: "center",
                                              padding: "12px 8px",
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              {slotIndex === 0 && (
                                                <IconButton
                                                  sx={{
                                                    height: "35px",
                                                    width: "35px",
                                                    color: "white",
                                                    bgcolor: (theme) =>
                                                      theme.palette.primary
                                                        .main,
                                                    "&:hover": {
                                                      bgcolor: (theme) =>
                                                        theme.palette.primary
                                                          .dark,
                                                    },
                                                  }}
                                                  onClick={() =>
                                                    addNewTimeSlot(dayIndex)
                                                  }
                                                >
                                                  <IconPlus />
                                                </IconButton>
                                              )}
                                              {slotIndex > 0 && (
                                                <IconButton
                                                  sx={{
                                                    height: "35px",
                                                    width: "35px",
                                                    color: "white",
                                                    bgcolor: "#DA514E",
                                                    "&:hover": {
                                                      bgcolor: (theme) =>
                                                        theme.palette.error
                                                          .main,
                                                    },
                                                  }}
                                                  onClick={() =>
                                                    removeTimeSlot(
                                                      dayIndex,
                                                      slotIndex
                                                    )
                                                  }
                                                >
                                                  <IconTrash />
                                                </IconButton>
                                              )}
                                            </Box>
                                          </TableCell> */}
                                        </TableRow>
                                      ))}
                                  </React.Fragment>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </FieldArray>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Box className="flex justify-end gap-4 mt-4">
              <>
                {activeStep > 0 && (
                  <Button
                    sx={{
                      px: 6,
                      py: 1,
                      width: "172px",
                      height: "56px",
                      fontSize: "16px",
                    }}
                    onClick={() => setActiveStep((prev) => prev - 1)}
                    variant="outlined"
                    type="button"
                  >
                    {t("back", keys)}
                  </Button>
                )}
                <Button
                  sx={{
                    px: 6,
                    py: 1,
                    width: "172px",
                    height: "56px",
                    fontSize: "16px",
                  }}
                  onClick={handleNextStep}
                  variant="outlined"
                  type="button"
                  hidden={activeStep === 1}
                >
                  {t("next", keys)}
                </Button>

                <Button
                  sx={{
                    px: 6,
                    py: 1,
                    width: "172px",
                    height: "56px",
                    fontSize: "16px",
                  }}
                  variant="contained"
                  type="submit"
                  hidden={activeStep === 0}
                >
                  {t("save", keys)}
                </Button>
              </>
            </Box>
          </form>
        </FormikProvider>
      </PageContainer>
    </>
  );
};

export default ManageSites;
