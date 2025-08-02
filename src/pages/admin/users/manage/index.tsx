import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Checkbox,
  FormControl,
  List,
  ListItem,
  Divider,
  FormControlLabel,
  Button,
  Autocomplete,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import * as yup from "yup";
import PageContainer from "@/components/container/PageContainer";
import { useTailwind } from "@/components/providers/TailwindProvider";
import HorizontalStepper from "@/components/stepper/HorizontalStepper";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import {
  IconChevronDown,
} from "@tabler/icons-react";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import PhoneInput, { getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Grid from "@mui/material/Grid2";
import { useRouter } from "next/router";
import { useFormik, getIn } from "formik";
import axios from "axios";
import Image from "next/image";
import { AccessRights2, AlertInterface, LatLng, User } from "@/types/admin/types";
import Map from "@/components/map/Map";
import Alert from "@/components/alert/Alert";
import Loader from "@/components/loader/Loader";
import { useSession } from "next-auth/react";
import Flag from "react-world-flags";
import CustomPhoneInput from "@/components/forms/theme-elements/CustomPhoneInput";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "@/components/common/ToastMessages";
import CustomCheckbox from "@/components/forms/theme-elements/CustomCheckbox";
const countryFlagEmoji = require("country-flag-emoji");
import parsePhoneNumberFromString from "libphonenumber-js";
import { DEFAULT_SCHEDULE_DAYS, SCHEDULE_TABLE_HEADINGS } from "@/constants";
import CustomSelect from "@/components/forms/theme-elements/CustomSelect";
import React from "react";
import { TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import CustomSwitch from "@/components/switches/CustomSwitch";
import {
  getScheduleForDays,
} from "@/helpers/getScheduleForDay";
import { useSelector } from "@/store/Store";
import { t } from "../../../../../lib/translationHelper";
import AccessDenied from "@/components/NoAccessPage";
import { checkAccess } from "../../../../../lib/clientExtras";

const ManageUsers = () => {
  const { data: session } = useSession();
  const [openMapModal, setOpenMapModal] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<LatLng>({
    lat: 37.0902,
    lng: -95.7129,
  });
  const [activeStep, setActiveStep] = useState(0);
  const [roles, setRoles] = useState<Record<string, any>>([]);
  const router = useRouter();
  const [action, setAction] = useState("create");
  const [loading, setLoading] = useState(false);
  const [expand, setExpand] = useState("");
  const [locations, setLocations] = useState<Record<string, any>[]>([]);
  const [placeholder, setPlaceholder] = useState("+1");
  const [showStaffPassword, setStaffShowPassword] = useState(false);
  const [showBackOfficePassword, setShowBackOfficePassword] = useState(false);
  const steps = ["basic_information", "access_rights"];
  const [submitAction, setSubmitAction] = useState<"save" | "saveAndContinue">(
    "save"
  );
  const [languages, setLanguages] = useState<any[]>([]);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [initialUser, setIntialUser] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "users" }
        );
        const response2 = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "sidebar" }
        );
        if (response2.status === 200 || response.status === 200) { setKeys([...response.data, ...response2.data]); }
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/languages/getlanguages");
        console.log(response);
        setLanguages(response.data);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    setOpenMapModal(false);
  };

  useEffect(() => {
    fetchRoles();
    fetchLocations();
  }, []);

  const fetchUser = async (id: string | string[]) => {
    try {
      const response = await axios.post("/api/users/fetchuser", {
        id,
      });
      const userLinks = userData.accessrights.links;
      const responseLinks = response.data.accessrights?.links || [];

      const updatedLinks = userLinks.map((userLink) => {
        const correspondingResponseLink = responseLinks.find(
          (responseLink: any) => responseLink.name === userLink.name
        );

        if (correspondingResponseLink) {
          const missingItems = userLink.items.filter(
            (userItem) =>
              !correspondingResponseLink.items.some(
                (responseItem: any) => responseItem.title === userItem.title
              )
          );

          return {
            ...correspondingResponseLink,
            items: [...correspondingResponseLink.items, ...missingItems],
          };
        }

        return userLink;
      });
      const days = getScheduleForDays(response.data.days);
      const updatedData = {
        ...response.data,
        days: days,
        accessrights: {
          ...response.data.accessrights,
          links: updatedLinks,
        },
      };
      formik.setValues(updatedData);
      setIntialUser(updatedData);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };
  useEffect(() => {
    if (router.query.action === "view" && router.query.id) {
      setAction("view");
      fetchUser(router.query.id);
    }
  }, [router.query]);

  const fetchRoles = async () => {
    try {
      const response = await axios.post("/api/roles/getusersroles");
      setRoles(response.data.roles);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/location/fetchlocations", {
        fetchAll: true,
      });
      setLocations(response.data.locations);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .email(t("enter_a_valid_email", keys))
      .required(t("email_is_required", keys))
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "invalid_email_format")
      .test(
        "email-exists",
        t("email_already_exists", keys),
        async (value: string, schema: any) => {
          try {
            const response = await axios.post("/api/clients/verifyuseremail", {
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
    password: yup
      .string()
      .min(8, "password_must_be_at_least_8_characters_long")
      .nullable()
      .test(
        "required-for-backofficeuser",
        t("password_is_required", keys),
        (value) => {
          if (passwordRequired && !value) {
            return false;
          }
          return true;
        }
      ),
    phone: yup
      .string()
      .required(t("phone_is_required", keys))
      .test(
        "is-valid-phone",
        t("phone_number_must_be_valid_and_include_the_country_code", keys),
        (value) => {
          if (!value) return false;
          const phoneNumber = parsePhoneNumberFromString(value);
          return phoneNumber ? phoneNumber.isValid() : false;
        }
      ),
    first_name: yup
      .string()
      .min(2, t("too_short", keys))
      .max(50, t("too_long", keys))
      .required(t("first_name_is_required", keys)),
    last_name: yup
      .string()
      .min(2, t("too_short", keys))
      .max(50, t("too_long", keys))
      .required(t("last_name_is_required", keys)),
    personal_identification_no: yup
      .string()
      .min(2, t("too_short", keys))
      .max(50, t("too_long", keys))
      .required(t("personal_identification_number_is_required", keys)),
    pin: yup
      .string()
      .min(2, t("too_short", keys))
      .max(8, t("too_long", keys))
      .nullable()
      .test("required-for-otherusers", t("pin_is_required", keys), (value) => {
        if (
          formik.values.roles.includes(
            roles.find(
              (r: any) =>
                r.name !== "BackOfficeUser" &&
                formik.values.roles.includes(r.id)
            )?.id
          ) &&
          !value
        ) {
          return false;
        }
        return true;
      }),
    country: yup
      .string()
      .min(2, t("too_short", keys))
      .max(50, t("too_long", keys))
      .required(t("country_is_required", keys)),

    street: yup
      .string()
      .min(2, t("too_short", keys))
      .max(50, t("too_long", keys))
      .required(t("street_is_required", keys)),
    city: yup
      .string()
      .min(2, t("too_short", keys))
      .max(50, t("too_long", keys))
      .required(t("city_is_required", keys)),
    postcode: yup
      .string()
      .min(2, t("too_short", keys))
      .max(50, t("too_long", keys))
      .required(t("postcode_is_required", keys)),
    roles: yup
      .array()
      .of(yup.string())
      .min(1, t("at_least_one_role_is_required", keys))
      .required(t("at_least_one_role_is_required", keys)),
    days: yup.array().of(
      yup.object().shape({
        id: yup.string().required("id_required"),
        name: yup.string().required("name_required"),
        timeSlots: yup.array().of(
          yup.object().shape({
            schedule_enabled: yup.boolean().required("schedule_enabled_required"),
            schedule_from: yup
              .string()
              .nullable()
              .when("schedule_enabled", {
                is: true,
                then: (schema) => schema.required("schedule_from_required"),
                otherwise: (schema) => schema.notRequired(),
              }),
            schedule_to: yup
              .string()
              .nullable()
              .when("schedule_enabled", {
                is: true,
                then: (schema) => schema.required("schedule_to_required"),
                otherwise: (schema) => schema.notRequired(),
              }),
          })
        ),
      })
    ),
  });
  const userData: User = {
    email: "",
    username: "",
    password: "",
    phone: "",
    first_name: "",
    last_name: "",
    pin: "",
    display_color: "#fff",
    country: "",
    street: "",
    city: "",
    postcode: "",
    state: "",
    personal_identification_no: "",
    roles: [],
    days: DEFAULT_SCHEDULE_DAYS,
    client_language_id: "",
    accessrights: {
      links: [
        {
          name: "dashboard",
          items: [
            {
              title: "dashboard",
              href: "/admin/dashboard",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
          ],
        },
        {
          name: "location",
          items: [
            {
              title: "overview",
              href: "/admin/locations-overview",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
            {
              title: "appointments",
              href: "/admin/appointments",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
            {
              title: "orders",
              href: "/admin/orders",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
            {
              title: "customers",
              href: "/admin/customers",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
          ],
        },

        {
          name: "services",
          items: [
            {
              title: "services",
              href: "/admin/services",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
            {
              title: "categories",
              href: "/admin/categories",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
          ],
        },

        {
          name: "my_salon",
          items: [
            {
              title: "devices",
              href: "/admin/devices",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
            {
              title: "users",
              href: "/admin/users",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
            {
              title: "turn_tracker",
              href: "/admin/turn-tracker",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
            {
              title: "user_services",
              href: "/admin/user-services",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
          ],
        },
        {
          name: "benefits",
          items: [
            {
              title: "gift_cards",
              href: "/admin/benefits/gift-cards",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
            {
              title: "loyalty",
              href: "/admin/loyalty",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
          ],
        },
        {
          name: "other",
          items: [
            {
              title: "payroll",
              href: "/admin/payroll",
              view: false,
              add: false,
              edit: false,
              delete: false,
            },
          ],
        },
      ],
      companies: [],
      locations: [],
    },
    waiter_accessrights: {
      order_by_table: false,
      order_by_person: false,
      print_invoice: false,
      payment_by_cash: false,
      payment_by_card: false,
      scan_qr_code: false,
      view_sales_analytics: false,
      profile: false,
      reverse_invoice: false,
      remove_products: false,
      make_reservation: false,
      waiter_nav_menu: false,
      waiter_nav_takeaway: false,
      waiter_nav_delivery: false,
      waiter_nav_reservations: false,
      waiter_nav_sales_report: false,
      waiter_nav_profit_loss: false,
      waiter_nav_cancelled_orders: false,
      waiter_nav_activity_log: false,
      waiter_nav_support: false,
      waiter_nav_stock_management: false,
      waiter_nav_Settings: false,
      mainpos_nav_tables: false,
      mainpos_nav_open_table: false,
      mainpos_nav_invoices: false,
      mainpos_nav_reservations: false,
      mainpos_nav_analytics: false,
      mainpos_nav_table_layout: false,
      mainpos_nav_profile: false,
      mainpos_nav_support: false,
    },
  };
  const formik = useFormik({
    validateOnChange: true,
    validateOnBlur: true,
    initialValues: userData,
    validationSchema: activeStep === 0 && validationSchema,
    onSubmit: (values) => {
      const isBackOfficeUser = roles.some(
        (r: any) => r.name === "BackOfficeUser" && formik.values.roles.includes(r.id)
      );

      if (isBackOfficeUser && activeStep === 0) {
        return setActiveStep(1);
      }

      let url = "/api/users/adduser";
      if (action == "view") {
        url = "/api/users/updateuser";
      }

      const manageLocation = async () => {
        try {
          setLoading(true);
          const response = await axios.post(url, {
            ...values,
            client: session?.user,
          });

          if (response.status === 201) {
            if (submitAction === "save") {
              router.push("/admin/users");
            } else {
              formik.resetForm();
              setActiveStep(0);
            }
            ToastSuccessMessage(
              response.data.message || "user_created_successfully" || "created!"
            );
          }

          if (response.status === 200) {
            router.push("/admin/users");
            ToastSuccessMessage(
              response.data.message || "user_updated_successfully" || "updated!"
            );
          }
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      };

      manageLocation();
    },
  });

  useEffect(() => {
    if (
      action === "create" &&
      formik.values.roles.includes(
        roles.find((r: any) => r.name === "BackOfficeUser")?.id
      )
    ) {
      setPasswordRequired(true);
    } else if (
      action === "view" &&
      initialUser?.roles?.includes(
        roles.find((r: any) => r.name === "BackOfficeUser")?.id
      ) &&
      !formik.values.roles.includes(
        roles.find((r: any) => r.name === "BackOfficeUser")?.id
      )
    ) {
      setPasswordRequired(false);
    } else if (
      action === "view" &&
      !initialUser?.roles?.includes(
        roles.find((r: any) => r.name === "BackOfficeUser")?.id
      ) &&
      formik.values.roles.includes(
        roles.find((r: any) => r.name === "BackOfficeUser")?.id
      )
    ) {
      setPasswordRequired(true);
    } else {
      setPasswordRequired(false);
    }
  }, [formik.values, action, roles, initialUser]);

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };


  const handleCountryChange = (country: any | undefined) => {
    const countryCode = country ? `+${getCountryCallingCode(country)}` : "";
    setPlaceholder(countryCode);
  };

  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/users")) {
      router.push("/admin/login");
    }
  }, [session]);

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

  const isBackOfficeUser = useMemo(() => {
    return roles.some(
      (r: any) => r.name === "BackOfficeUser" && formik.values.roles.includes(r.id)
    );
  }, [formik.values.roles, roles]);

  return (
    <>
      {(session?.user?.roles?.includes("Owner") ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            (session.user as any).accessrights?.controls as AccessRights2,
            "/admin/users/manage",
            action === "create" ? "add" : "edit"
          ))) ? (<PageContainer
            topbar={
              isBackOfficeUser ? <HorizontalStepper
                steps={steps}
                activeStep={activeStep}
                onStepClick={handleStepClick}
              /> : <></>
            }
          >
            <Loader loading={loading} />
            <form onSubmit={formik.handleSubmit}>
              {activeStep === 0 ? (
                <Grid container spacing={4} columns={12}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        borderRadius: "6px",
                        border: "1px #CCCCCC solid",
                        pt: 2,
                        my: 2,
                      }}
                    >
                      <Typography sx={{ p: 2 }} variant="h6">
                        {t("roles", keys)}
                      </Typography>
                      <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                        {roles.map((r: any, index: number) => {
                          return (
                            <>
                              <ListItem className="capitalize">
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={formik.values.roles.includes(r.id)}
                                      onChange={(e) => {
                                        if (r.name === "BackOfficeUser") {
                                          formik.setFieldValue("password", "");
                                        }
                                        if (e.target.checked) {
                                          formik.setFieldValue("roles", [
                                            ...formik.values.roles,
                                            r.id,
                                          ]);
                                        } else {
                                          formik.setFieldValue(
                                            "roles",
                                            formik.values.roles.filter(
                                              (roleId) => (roleId as any) !== r.id
                                            )
                                          );
                                        }
                                      }}
                                      name="roles"
                                      onBlur={formik.handleBlur}
                                      value={r.id}
                                    />
                                  }
                                  label={t(r?.name?.toLowerCase(), keys)}
                                />
                              </ListItem>

                              {index < roles.length - 1 && <Divider />}
                            </>
                          );
                        })}
                        {formik.touched.roles && formik.errors.roles && (
                          <ListItem>
                            <Typography color="error">
                              {String(formik.errors.roles)}
                            </Typography>
                          </ListItem>
                        )}
                      </List>
                    </Box>

                    {passwordRequired && (
                      <>
                        <CustomFormLabel required>
                          {t("backoffice_password", keys)}
                        </CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          id="password"
                          name="password"
                          placeholder="Type here"
                          value={formik.values.password}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          type={showBackOfficePassword ? "text" : "password"}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => setShowBackOfficePassword(!showBackOfficePassword)}
                                  edge="end"
                                >
                                  {showBackOfficePassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          error={
                            formik.touched.password && Boolean(formik.errors.password)
                          }
                          helperText={
                            formik.touched.password && t(formik.errors.password as string, keys)
                          }
                        />
                      </>
                    )}

                    {formik.values.roles.includes(
                      roles.find(
                        (r: any) =>
                          r.name !== "BackOfficeUser" &&
                          formik.values.roles.includes(r.id)
                      )?.id
                    ) && (
                        <>
                          <>
                            <CustomFormLabel required>
                              {t("app_pin", keys)}
                            </CustomFormLabel>
                            <CustomTextField
                              fullWidth
                              id="pin"
                              name="pin"
                              type={showStaffPassword ? "text" : "password"}
                              placeholder={t("type_here", keys)}
                              value={formik.values.pin}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              error={formik.touched.pin && Boolean(formik.errors.pin)}
                              helperText={formik.touched.pin && t(formik.errors.pin as string, keys)}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      aria-label="toggle password visibility"
                                      onClick={() => setStaffShowPassword(!showStaffPassword)}
                                      edge="end"
                                    >
                                      {showStaffPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </>
                          <Box>
                            <CustomFormLabel className="capitalize">{t("display_color", keys)}</CustomFormLabel>
                            <CustomTextField
                              type="color"
                              name="display_color"
                              value={formik.values.display_color}
                              onChange={formik.handleChange}
                              className="w-full"
                            />
                          </Box>
                        </>
                      )}
                    <Box>
                      <CustomFormLabel>{t("language", keys)}</CustomFormLabel>
                      <CustomSelect
                        fullWidth
                        name="client_language_id"
                        value={formik.values.client_language_id || ""}
                        onChange={formik.handleChange}
                        displayEmpty
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                              overflowY: "auto",
                            },
                          },
                          anchorOrigin: {
                            vertical: "bottom",
                            horizontal: "center",
                          },
                          transformOrigin: {
                            vertical: "top",
                            horizontal: "center",
                          },
                        }}
                        renderValue={(selected: any) => {
                          const selectedLang = languages.find(
                            (item) => item.id === selected
                          );
                          return selected ? (
                            <Grid container alignItems="center">
                              <Grid>
                                <Flag
                                  code={selectedLang?.language_code}
                                  style={{
                                    width: 24,
                                    height: 16,
                                    marginRight: 10,
                                  }}
                                />
                              </Grid>
                              <Grid>{selectedLang?.language_name}</Grid>
                            </Grid>
                          ) : (
                            t("choose_language", keys)
                          );
                        }}
                      >
                        {languages.map((language) => (
                          <MenuItem key={language.id} value={language.id}>
                            <Grid container alignItems="center">
                              <Grid>
                                <Flag
                                  code={language.language_code}
                                  style={{
                                    width: 24,
                                    height: 16,
                                    marginRight: 10,
                                  }}
                                />
                              </Grid>
                              <Grid>{language.language_name}</Grid>
                            </Grid>
                          </MenuItem>
                        ))}
                      </CustomSelect>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <CustomFormLabel required>
                      {t("first_name", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="first_name"
                      name="first_name"
                      value={formik.values.first_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder={t("type_here", keys)}
                      error={
                        formik.touched.first_name && Boolean(formik.errors.first_name)
                      }
                      helperText={
                        formik.touched.first_name && t(formik.errors.first_name as string, keys)
                      }
                    />
                    <CustomFormLabel required>{t("last_name", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="last_name"
                      name="last_name"
                      placeholder={t("type_here", keys)}
                      value={formik.values.last_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.last_name && Boolean(formik.errors.last_name)
                      }
                      helperText={formik.touched.last_name && t(formik.errors.last_name as string, keys)}
                    />
                    <CustomFormLabel required>
                      {t("personal_identification_number", keys)}
                    </CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      placeholder={t("type_here", keys)}
                      id="personal_identification_no"
                      name="personal_identification_no"
                      value={formik.values.personal_identification_no}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.personal_identification_no &&
                        Boolean(formik.errors.personal_identification_no)
                      }
                      helperText={
                        formik.touched.personal_identification_no &&
                        formik.errors.personal_identification_no
                      }
                    />
                    <CustomFormLabel required>{t("email", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      placeholder={t("type_here", keys)}
                      type="email"
                      id="email"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && t(formik.errors.email as string, keys)}
                    />
                    <CustomFormLabel required>
                      {t("phone_number", keys)}
                    </CustomFormLabel>
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
                    <CustomPhoneInput
                      className="custom-phone-input"
                      defaultCountry="US"
                      // style={{
                      //   height: "45px",
                      //   borderRadius: "7px",
                      // }}
                      id="mobile"
                      placeholder={placeholder}
                      value={formik.values.phone as any}
                      onChange={(phone: any) => formik.setFieldValue("phone", phone)}
                      onBlur={() => formik.setFieldTouched("phone", true)}
                      onCountryChange={(c: any) => handleCountryChange(c)}
                    />
                    {formik.touched.phone && formik.errors.phone ? (
                      <Typography variant="body2" color="error">
                        {typeof formik.errors.phone === "string"
                          ? t(formik.errors.phone as string, keys)
                          : ""}
                      </Typography>
                    ) : null}
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
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
                              {...params}
                              fullWidth
                              placeholder={t("select_country", keys)}
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
                                    style={{ height: "15px", marginRight: "8px" }}
                                  />
                                ) : null,
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <MenuItem {...props} key={option.code}>
                              <Flag
                                code={option.code}
                                style={{ height: "15px", marginRight: "8px" }}
                              />
                              {option.name}
                            </MenuItem>
                          )}
                        />

                        {formik.touched.country && formik.errors.country && (
                          <FormHelperText>
                            {t(formik.errors.country as string, keys)}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Box>
                    <Box className="flex gap-2 items-center">
                      <Box className="w-full">
                        <CustomFormLabel required>
                          {t("street", keys)}
                        </CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          placeholder={t("type_here", keys)}
                          id="street"
                          name="street"
                          value={formik.values.street}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.street && Boolean(formik.errors.street)
                          }
                          helperText={formik.touched.street && t(formik.errors.street as string, keys)}
                        />
                      </Box>

                      <Box className="w-40">
                        <CustomFormLabel>
                          {t("select_location", keys)}
                        </CustomFormLabel>
                        <Button
                          variant="outlined"
                          onClick={() => setOpenMapModal(true)}
                        >
                          <Image src={"/img/map.png"} width={25} height={25} alt="" />
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
                    </Box>
                    <CustomFormLabel required>{t("city", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="city"
                      name="city"
                      placeholder={t("type_here", keys)}
                      value={formik.values.city}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.city && Boolean(formik.errors.city)}
                      helperText={formik.touched.city && t(formik.errors.city as string, keys)}
                    />
                    <CustomFormLabel required>{t("postcode", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="postcode"
                      name="postcode"
                      placeholder={t("type_here", keys)}
                      value={formik.values.postcode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.postcode && Boolean(formik.errors.postcode)
                      }
                      helperText={formik.touched.postcode && t(formik.errors.postcode as string, keys)}
                    />
                    <CustomFormLabel>{t("state", keys)}</CustomFormLabel>
                    <CustomTextField
                      fullWidth
                      id="state"
                      name="state"
                      placeholder={t("type_here", keys)}
                      value={formik.values.state}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.state && Boolean(formik.errors.state)}
                      helperText={formik.touched.state && t(formik.errors.state as string, keys)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, xl: 6 }}>
                    <CustomFormLabel required>{t("schedule", keys)}</CustomFormLabel>
                    <Box
                      sx={{
                        border: "1px solid #CCCCCC",
                        borderRadius: "8px",
                        overflow: "hidden",
                        padding: "0px",
                        marginTop: "3px",
                      }}
                    >
                      <TableContainer sx={{ padding: "0px !important" }}>
                        <Table
                          sx={{
                            width: "100%",
                            borderSpacing: "0rem",
                            borderCollapse: "separate",
                            paddingInline: "0px",
                          }}
                          aria-labelledby="tableTitle"
                        >
                          <TableHead>
                            <TableRow>
                              {SCHEDULE_TABLE_HEADINGS.filter((h => h !== "time_slot")).map(
                                (header: any, index: any) => (
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
                                          header === "enabled" ? "center" : "left",
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
                                            {t(day.name.toLowerCase(), keys)}
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
                                          value={slot.schedule_from ? dayjs(slot.schedule_from, "HH:mm") : null}
                                          onChange={(newValue: any) => {
                                            const formattedValue = newValue?.format("HH:mm");
                                            formik.setFieldValue(
                                              `days[${dayIndex}].timeSlots[${slotIndex}].schedule_from`,
                                              formattedValue
                                            );
                                          }}
                                          onClose={() => {
                                            formik.setFieldTouched(
                                              `days[${dayIndex}].timeSlots[${slotIndex}].schedule_from`,
                                              true
                                            );
                                          }}
                                          ampm={true}
                                          minutesStep={1}
                                          slots={{
                                            textField: TextField,
                                            openPickerIcon: () => (
                                              <AccessTimeIcon sx={{ fontSize: "14px" }} />
                                            ),
                                          }}
                                          slotProps={{
                                            textField: {
                                              error: !!getIn(
                                                formik.errors,
                                                `days[${dayIndex}].timeSlots[${slotIndex}].schedule_from`
                                              ),
                                              helperText: getIn(
                                                formik.errors,
                                                `days[${dayIndex}].timeSlots[${slotIndex}].schedule_from`
                                              )
                                                ? t(
                                                  getIn(
                                                    formik.errors,
                                                    `days[${dayIndex}].timeSlots[${slotIndex}].schedule_from`
                                                  ),
                                                  keys
                                                )
                                                : ``,
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
                                                "& .MuiFormHelperText-root": {
                                                  fontSize: "11px",
                                                  marginTop: "-5px",
                                                  lineHeight: "1.2",
                                                  minHeight: "0",
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
                                        <TimePicker
                                          value={
                                            slot.schedule_to
                                              ? dayjs(slot.schedule_to, "HH:mm")
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
                                          ampm={true}
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
                                              error:
                                                !!getIn(formik.errors, `days[${dayIndex}].timeSlots[${slotIndex}].schedule_to`),
                                              helperText:
                                                getIn(formik.errors, `days[${dayIndex}].timeSlots[${slotIndex}].schedule_to`)
                                                  ? t(
                                                    getIn(formik.errors, `days[${dayIndex}].timeSlots[${slotIndex}].schedule_to`),
                                                    keys
                                                  )
                                                  : "",
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
                                                "& .MuiFormHelperText-root": {
                                                  fontSize: "11px",
                                                  marginTop: "-5px",
                                                  lineHeight: "1.2",
                                                  minHeight: "0",
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
                                            checked={slot.schedule_enabled}
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
                                          bgcolor: (theme: any) =>
                                            theme.palette.primary.main,
                                          "&:hover": {
                                            bgcolor: (theme: any) =>
                                              theme.palette.primary.dark,
                                          },
                                        }}
                                        onClick={() => addNewTimeSlot(dayIndex)}
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
                                              theme.palette.error.main,
                                          },
                                        }}
                                        onClick={() =>
                                          removeTimeSlot(dayIndex, slotIndex)
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
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={4} columns={{ xs: 4, lg: 8 }}>
                  {formik.values.roles.includes(
                    roles.find(
                      (r: any) =>
                        r.name === "BackOfficeUser" &&
                        formik.values.roles.includes(r.id)
                    )?.id
                  ) && (
                      <Grid size={{ xs: 12, lg: 6 }}>
                        <CustomFormLabel required className="text-lg">
                          {t("backoffice_user", keys)}
                        </CustomFormLabel>

                        {formik.values.accessrights.links.map((ac, acIndex) => (
                          <Accordion expanded={expand === ac.name}>
                            <AccordionSummary
                              expandIcon={<IconChevronDown />}
                              onClick={() =>
                                setExpand((prev) => (prev === ac.name ? "" : ac.name))
                              }
                            >
                              <Typography className="font-semibold">
                                {t(ac.name, keys)}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                                {ac.items
                                  .filter((item) =>
                                    session?.user?.navigation?.includes(item.href)
                                  )
                                  .map((item, itemIndex) => (
                                    <>
                                      <Box className="flex gap-2 justify-between items-center">
                                        <Typography>{t(item.title, keys)}</Typography>
                                        <Box className="space-x-6">
                                          <FormControlLabel
                                            control={
                                              <CustomCheckbox
                                                checked={
                                                  formik.values.accessrights.links[
                                                    acIndex
                                                  ].items[itemIndex].view
                                                }
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    formik.setFieldValue(
                                                      `accessrights.links[${acIndex}].items[${itemIndex}].view`,
                                                      true
                                                    );
                                                  } else {
                                                    formik.setFieldValue(
                                                      `accessrights.links[${acIndex}].items[${itemIndex}].view`,
                                                      false
                                                    );
                                                    formik.setFieldValue(
                                                      `accessrights.links[${acIndex}].items[${itemIndex}].add`,
                                                      false
                                                    );
                                                    formik.setFieldValue(
                                                      `accessrights.links[${acIndex}].items[${itemIndex}].edit`,
                                                      false
                                                    );
                                                    formik.setFieldValue(
                                                      `accessrights.links[${acIndex}].items[${itemIndex}].delete`,
                                                      false
                                                    );
                                                  }
                                                }}
                                              />
                                            }
                                            label={t("view", keys)}
                                          />

                                          <FormControlLabel
                                            control={
                                              <CustomCheckbox
                                                disabled={
                                                  !formik.values.accessrights.links[
                                                    acIndex
                                                  ].items[itemIndex].view
                                                }
                                                checked={
                                                  formik.values.accessrights.links[
                                                    acIndex
                                                  ].items[itemIndex].add
                                                }
                                                onChange={(e) => {
                                                  formik.setFieldValue(
                                                    `accessrights.links[${acIndex}].items[${itemIndex}].add`,
                                                    e.target.checked
                                                  );
                                                }}
                                              />
                                            }
                                            label={t("add", keys)}
                                          />

                                          <FormControlLabel
                                            control={
                                              <CustomCheckbox
                                                disabled={
                                                  !formik.values.accessrights.links[
                                                    acIndex
                                                  ].items[itemIndex].view
                                                }
                                                checked={
                                                  formik.values.accessrights.links[
                                                    acIndex
                                                  ].items[itemIndex].edit
                                                }
                                                onChange={(e) => {
                                                  formik.setFieldValue(
                                                    `accessrights.links[${acIndex}].items[${itemIndex}].edit`,
                                                    e.target.checked
                                                  );
                                                }}
                                              />
                                            }
                                            label={t("edit", keys)}
                                          />

                                          <FormControlLabel
                                            control={
                                              <CustomCheckbox
                                                disabled={
                                                  !formik.values.accessrights.links[
                                                    acIndex
                                                  ].items[itemIndex].view
                                                }
                                                checked={
                                                  formik.values.accessrights.links[
                                                    acIndex
                                                  ].items[itemIndex].delete
                                                }
                                                onChange={(e) => {
                                                  formik.setFieldValue(
                                                    `accessrights.links[${acIndex}].items[${itemIndex}].delete`,
                                                    e.target.checked
                                                  );
                                                }}
                                              />
                                            }
                                            label={t("delete", keys)}
                                          />
                                        </Box>
                                      </Box>
                                      <Divider />
                                    </>
                                  ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        ))}

                        <Accordion expanded={expand === "location-area"}>
                          <AccordionSummary
                            expandIcon={<IconChevronDown />}
                            onClick={() =>
                              setExpand((prev) =>
                                prev === "location-area" ? "" : "location-area"
                              )
                            }
                          >
                            <Typography className="font-semibold">
                              {t("locations", keys)}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                              {locations.map((item, itemIndex) => (
                                <>
                                  <Box className="flex gap-2 justify-between items-center">
                                    <Typography>
                                      {t(item.location_name, keys)}
                                    </Typography>
                                    <Box className="space-x-6">
                                      <FormControlLabel
                                        control={
                                          <CustomCheckbox
                                            checked={formik.values.accessrights.locations?.some(
                                              (c) => c.location_id === item.id && c.view
                                            )}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                const toPush = {
                                                  location_id: item.id,
                                                  company_id: item.company_id,
                                                  location_name: item.location_name,
                                                  view: true,
                                                  edit: false,
                                                };

                                                formik.setFieldValue(
                                                  "accessrights.locations",
                                                  [
                                                    ...formik.values.accessrights
                                                      .locations,
                                                    toPush,
                                                  ]
                                                );
                                              } else {
                                                formik.setFieldValue(
                                                  "accessrights.locations",
                                                  [
                                                    ...formik.values.accessrights.locations.filter(
                                                      (c) => c.location_id !== item.id
                                                    ),
                                                  ]
                                                );
                                              }
                                            }}
                                          />
                                        }
                                        label={t("view", keys)}
                                      />

                                      {/* <FormControlLabel
                                control={
                                  <CustomCheckbox
                                    disabled={
                                      !formik.values.accessrights.locations?.some(
                                        (c) => c.location_id === item.id
                                      )
                                    }
                                    checked={formik.values.accessrights.locations?.some(
                                      (c) => c.location_id === item.id && c.edit
                                    )}
                                    onChange={(e) => {
                                      formik.setFieldValue(
                                        "accessrights.locations",
                                        formik.values.accessrights.locations.map(
                                          (c) => {
                                            if (c.location_id === item.id) {
                                              return {
                                                ...c,
                                                edit: e.target.checked,
                                              };
                                            }
                                            return c;
                                          }
                                        )
                                      );
                                    }}
                                  />
                                }
                                label={t("edit")}
                              /> */}
                                    </Box>
                                  </Box>
                                  <Divider />
                                </>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    )}
                  {formik.values.roles.includes(
                    roles.find(
                      (r: any) =>
                        r.name === "Waiter" && formik.values.roles.includes(r.id)
                    )?.id
                  ) && (
                      <>
                        <Grid size={{ xs: 12, lg: 2 }}>
                          <CustomFormLabel required className="text-lg">
                            {t("waiter", keys)}
                          </CustomFormLabel>
                          <Accordion expanded={true}>
                            <AccordionSummary expandIcon={<IconChevronDown />}>
                              <Typography className="font-semibold">
                                {t("general", keys)}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights.order_by_table
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.order_by_table",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("order_by_table", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .order_by_person
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.order_by_person",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("order_by_person", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights.print_invoice
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.print_invoice",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("print_invoice", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .payment_by_cash
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.payment_by_cash",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("payment_by_cash", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .payment_by_card
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.payment_by_card",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("payment_by_card", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights.scan_qr_code
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.scan_qr_code",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("scan_qr_code", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .view_sales_analytics
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.view_sales_analytics",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("view_sales_analytics", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights.profile
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.profile",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("profile", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .reverse_invoice
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.reverse_invoice",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("reverse_invoice", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .remove_products
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.remove_products",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("remove_products", keys)}
                                />

                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .make_reservation
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.make_reservation",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("make_reservation", keys)}
                                />
                                <Typography
                                  mt={2}
                                  gutterBottom
                                  variant="h6"
                                  fontWeight={700}
                                >
                                  {t("waiter_app_navigation", keys)}
                                </Typography>
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_menu
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_menu",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("menu", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_takeaway
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_takeaway",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("takeaway", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_delivery
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_delivery",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("delivery", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_reservations
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_reservations",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("reservation", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_sales_report
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_sales_report",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("sales_report", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_profit_loss
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_profit_loss",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("profit_loss", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_cancelled_orders
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_cancelled_orders",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("cancelled_orders", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_activity_log
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_activity_log",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("activity_log", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_support
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_support",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("support", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_stock_management
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_stock_management",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("stock_management", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .waiter_nav_Settings
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.waiter_nav_Settings",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("settings", keys)}
                                />
                                <Typography
                                  mt={2}
                                  gutterBottom
                                  variant="h6"
                                  fontWeight={700}
                                >
                                  {t("main_pos_navigation", keys)}
                                </Typography>
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .mainpos_nav_tables
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.mainpos_nav_tables",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("tables", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .mainpos_nav_open_table
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.mainpos_nav_open_table",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("open_tables", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .mainpos_nav_invoices
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.mainpos_nav_invoices",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("invoices", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .mainpos_nav_reservations
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.mainpos_nav_reservations",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("reservations", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .mainpos_nav_analytics
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.mainpos_nav_analytics",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("analytics", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .mainpos_nav_table_layout
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.mainpos_nav_table_layout",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("table_layout", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .mainpos_nav_profile
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.mainpos_nav_profile",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("profile", keys)}
                                />
                                <Divider />
                                <FormControlLabel
                                  control={
                                    <CustomCheckbox
                                      checked={
                                        formik.values.waiter_accessrights
                                          .mainpos_nav_support
                                      }
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          "waiter_accessrights.mainpos_nav_support",
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={t("support", keys)}
                                />
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        </Grid>
                      </>
                    )}
                </Grid>
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

                  {activeStep === 0 && isBackOfficeUser && (
                    <Button
                      variant="outlined"
                      type="button"
                      onClick={formik.handleSubmit as any}
                      sx={{ width: "172px", height: "56px", fontSize: "16px" }}
                    >
                      {t("next", keys)}
                    </Button>
                  )}

                  {(activeStep === 1 || !isBackOfficeUser) && (
                    <Button
                      sx={{ px: 4, py: 2 }}
                      variant="outlined"
                      color="primary"
                      hidden={action === "view"}
                      onClick={() => setSubmitAction("saveAndContinue")}
                      type="submit"
                    >
                      {t("save_and_continue", keys)}
                    </Button>
                  )}

                  {(activeStep === 1 || !isBackOfficeUser) && (
                    <Button
                      sx={{ px: 8, py: 2 }}
                      variant="contained"
                      color="primary"
                      onClick={() => setSubmitAction("save")}
                      type="submit"
                    >
                      {t("save", keys)}
                    </Button>
                  )}
                </>
              </Box>
            </form>
          </PageContainer>) : (<AccessDenied />)}
    </>
  );
};

export default ManageUsers;
