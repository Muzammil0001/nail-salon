import React, { useEffect, useState } from "react";
import {
  MenuItem,
  Button,
  Card,
  Tooltip,
  Stack,
  IconButton,
  Box,
  FormHelperText,
  Typography,
  Grid,
  Divider, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  TextField,
} from "@mui/material";
import {
  IconMinus,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useRouter } from 'next/router';
import PaymentQrDialog from "@/components/stripe/PaymentQrDialog";
import CheckoutFormDialog from "@/components/stripe/checkoutDialog";
import dayjs, { Dayjs } from 'dayjs';
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { Add, Remove, Delete } from "@mui/icons-material";
import PageContainer from "@/components/container/PageContainer";
import HorizontalStepper from "@/components/stepper/HorizontalStepper";
import Loader from "@/components/loader/Loader";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomSelect from "@/components/forms/theme-elements/CustomSelect";
import { t } from "../../../../lib/translationHelper";
import axios from "axios";
import { ToastErrorMessage, ToastSuccessMessage } from "@/components/common/ToastMessages";
import moment from "moment";
import { setLocationId, addOrUpdateItem, removeItem, clearReservation } from "@/store/ReservationSlice";
import { useDispatch, useSelector } from '@/store/Store';
import type { PaymentIntent } from '@stripe/stripe-js';
interface ReservationItem {
  service_id: string;
  category_id: string;
  price: number;
  quantity: number;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface FormValues {
  location_id: string;
  redeem_points: number;
  final_price: number;
  date: Date | null;
  staff_id: string;
  time_slot: TimeSlot;
  total_price: number;
  reservation: ReservationItem[];
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_altPhone: string;
  payment_method: string;
  payment_intent: PaymentIntent | null;
  coupon_code: string;
}


const STEPS = [
  "initial_details",
  "final_details",
];


const Appointments = () => {
  const router = useRouter();
  const dispatch: any = useDispatch();
  const storeReservation = useSelector((state) => state.reservation);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newService, setNewService] = useState("");
  const [branches, setBranches] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [customerPointsData, setCustomerPointsData] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<{ [key: string]: any[] }>({});
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [finalvalue, setfinalvalue] = useState();

  useEffect(() => {
    if (paymentSuccess) {
      formik.resetForm()
      setActiveStep(0)
      dispatch(clearReservation())
      ToastSuccessMessage("payment_sccuess_and_appointment_done")
    }
  }, [paymentSuccess])

  useEffect(() => {
    (async () => {
      try {
        const language_id = localStorage.getItem("language_id");
        const response = await axios.post("/api/app-translation/fetchbypagename", {
          language_id,
          page_name: "appointment",
        });
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const StepOneSchema = Yup.object({
    date: Yup.date().required("date_is_required"),
    staff_id: Yup.string().required("staff_member_is_required"),
    reservation: Yup.array()
      .of(
        Yup.object({
          category_id: Yup.string().required("category_is_required"),
          service_id: Yup.string().required("service_is_required"),
          quantity: Yup.number().min(1, "at_least_1").required("quantity_is_required"),
        })
      )
      .min(1, "at_least_one_service_must_be_selected"),
    time_slot: Yup.object({
      start_time: Yup.string()
        .required("time_slot_is_required")
        .test("is-valid-date", "start_time_must_be_a_valid_date", (value) => !value || !isNaN(Date.parse(value))),
      end_time: Yup.string()
        .required("time_slot_is_required")
        .test("is-valid-date", "end_time_must_be_a_valid_date", (value) => !value || !isNaN(Date.parse(value))),
    }).required("time_slot_is_required"),
    customer_first_name: Yup.string().required("customer_first_name_is_required"),
    customer_email: Yup.string()
      .email("invalid_email")
      .required("customer_email_is_required"),
    customer_phone: Yup.string().required("customer_phone_is_required"),
    customer_altPhone: Yup.string(),
  });

  const StepTwoSchema = Yup.object();

  const formik = useFormik<FormValues>({
    initialValues: {
      location_id: "",
      final_price: 0,
      redeem_points: 0,
      date: null,
      staff_id: "",
      time_slot: { start_time: "", end_time: "" },
      total_price: 0,
      reservation: [],
      customer_first_name: "",
      customer_last_name: "",
      customer_email: "",
      customer_phone: "",
      customer_altPhone: "",
      payment_method: "cash",
      payment_intent: null,
      coupon_code: ""
    },
    validationSchema:
      activeStep === 0
        ? StepOneSchema
        : StepTwoSchema,

    onSubmit: async (values) => {
      setActiveStep((prev) => prev + 1);
      if (
        values.payment_method === "card" && !values?.payment_intent
      ) {
        return;
      }

      setActiveStep((prev) => prev + 1);

      if (values?.payment_intent) {
        values.payment_method = "card";
      }
      setLoading(true)
      try {
        const response = await axios.post("/api/reservation/createreservation", values)
        if (response.status === 201) {
          formik.resetForm()
          setActiveStep(0)
          dispatch(clearReservation())
          ToastSuccessMessage(response?.data?.message)
        }
      } catch (error) {
        setActiveStep(0)
        ToastErrorMessage(error)
        console.error("Error while creating reservation", error);
      } finally {
        setLoading(false)
        formik.setFieldValue("payment_method", "cash")
      }
    },
  });

  useEffect(() => {
    if (formik.values.redeem_points === 0 && !finalvalue) {
      formik.setFieldValue("final_price", formik.values.total_price)
    }
  }, [formik.values.redeem_points])

  useEffect(() => {
    formik.setFieldValue("final_price", formik.values.total_price)
    formik.setFieldValue("redeem_points", 0)
    formik.setFieldValue("coupon_code", "")
  }, [formik.values.total_price])

  useEffect(() => {
    const fetchCustomerPoints = async () => {
      if (!formik.values.customer_email) return;

      try {
        const res = await axios.post("/api/reservation/fetchreservationcustomer", {
          location_id: formik.values.location_id,
          email: formik.values.customer_email,
        });

        if (res.status === 200 && res.data?.customer?.id) {
          const response = await axios.post("/api/loyalty/userloyaltypoints", {
            location_id: formik.values.location_id,
            user_id: res.data.customer.id,
          });

          if (response.status === 200) {
            setCustomerPointsData(response.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch customer loyalty points", error);
      }
    };

    fetchCustomerPoints();
  }, [formik.values.customer_email]);


  useEffect(() => {
    const checkCoupon = async () => {
      const code = formik.values.coupon_code?.trim();
      const total_price = formik.values.total_price;

      if (!code || code === "") {return;}

      if (code !=="" && formik.values.redeem_points > 0) {
        ToastErrorMessage("loyalty_points_gift_card_cannot_use_same_time")
        return;
      }

      try {
        const response = await axios.post("/api/gift-cards/applygiftcard", {
          gift_code: code,
          total_amount: total_price,
        });

        setfinalvalue(response.data.final_amount);
        formik.setFieldValue("final_price", response.data.final_amount);
        if (response.status === 200) {
          ToastSuccessMessage(response.data.message)
          formik.setFieldValue("final_price", response?.data?.final_amount);
        }
      } catch (error) {
        ToastErrorMessage(error)
      }
    };


    checkCoupon();
  }, [formik.values.coupon_code]);


  const handleStripeSuccess = ({ paymentIntent }: { paymentIntent: PaymentIntent | null }) => {
    if (paymentIntent?.id) {
      formik.setFieldValue('payment_intent', paymentIntent);
    }
  };

  useEffect(() => {
    if (formik.values?.payment_intent?.id)
      formik.submitForm();
  }, [formik.values?.payment_intent])

  useEffect(() => {
    const fetchStaffAvailableTimeSlotes = async () => {
      try {
        const { location_id, staff_id, reservation, date } = formik.values
        if (location_id && staff_id && date && reservation?.length > 0) {
          const resvServices = reservation.map((rsv: ReservationItem) => rsv.service_id)
          const response = await axios.post("/api/reservation/fetchavailableslots", { location_id, staff_id, service_ids: resvServices, date })
          setTimeSlots(response.data?.availableSlots)

        }
      } catch (error) {
        console.error("Error while fetch time slots", error);
        ToastErrorMessage(error)
      }
    }
    fetchStaffAvailableTimeSlotes()
  }, [formik.values.location_id, formik.values.staff_id, formik.values.reservation, formik.values.date])

  const handleNextStep = async (e: React.FormEvent) => {
    activeStep === 1 && formik.handleSubmit();
    e.preventDefault();
    const errors = await formik.validateForm();
    if (Object.keys(errors).length === 0) {
      formik.setTouched({});
      setActiveStep((prev) => prev + 1);
    } else {
      formik.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  };

  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        const { date, location_id } = formik.values
        if (date && location_id) {
          const response = await axios.post("/api/reservation/fetchstaff", { date, location_id });
          const staffData = response.data.users || [];
          setStaffMembers(staffData);
        }
      } catch (error) {
        console.error('Error while fetching staff members', error);
      }
    }
    fetchStaffMembers()
  }, [formik.values.location_id, formik.values.date]);

  const fetchServices = async () => {
    try {
      if (formik.values.location_id) {
        const response = await axios.post('/api/services/fetchservices', {
          fetchAll: true,
          location_id: formik.values.location_id
        });
        const services = response.data.services || [];

        const grouped: Record<string, any[]> = {};
        services.forEach((service: any) => {
          const catId = service.category_id;
          if (!grouped[catId]) {
            grouped[catId] = [];
          }
          grouped[catId].push(service);
        });
        setServicesByCategory(grouped);
      }
    } catch (error) {
      console.error('Error while fetching services', error);
    }
  };

  const fetchCategories = async () => {
    try {
      if (formik.values.location_id) {
        const response = await axios.post('/api/category/fetchcategories', { fetchAll: true, location_id: formik.values.location_id });
        const categoriesData = response.data.data || [];
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error while fetching categories', error);
    }
  }
  useEffect(() => {
    fetchCategories()
    fetchServices()
  }, [formik.values.location_id])

  useEffect(() => {
    const fetchAllLocations = async () => {
      try {
        const response = await axios.post('/api/location/fetchalllocations', {});
        const locs = response.data.locations || [];
        setBranches(locs);
        if (locs.length > 0) {
          formik.setFieldValue("location_id", locs[0]?.id);
        }
      } catch (error) {
        console.error('Error while fetching locations', error);
      }
    };
    fetchAllLocations();
  }, [formik.values]);

  const handleBackStep = () => { setActiveStep((prev) => prev - 1); formik.setFieldValue("payment_method", "cash") }


  const updateReservationsAndTotal = (updatedReservations: any[]) => {
    if (!updatedReservations || updatedReservations.length === 0) return;

    const reservationsWithPrice = updatedReservations.map((item) => {
      const srv = servicesByCategory?.[item.category_id]?.find(
        (s: any) => s.id === item.service_id
      );

      if (!srv) return null;

      const unitPrice = srv.price || 0;

      return {
        ...item,
        price: unitPrice,
      };
    }).filter(Boolean);

    const totalPrice = reservationsWithPrice.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );

    formik.setFieldValue("reservation", reservationsWithPrice);
    formik.setFieldValue("total_price", totalPrice);
    reservationsWithPrice.forEach((item) => {
      dispatch(
        addOrUpdateItem({
          category_id: item.category_id,
          service_id: item.service_id,
          quantity: item.quantity,
          price: item.price,
        })
      );
    });
  };

  useEffect(() => {
    if (storeReservation) {
      formik.setValues({
        ...formik.values,
        location_id: storeReservation.location_id || "",
        reservation: storeReservation.items,
        total_price: storeReservation.total_price,
      });
    }
  }, [storeReservation, servicesByCategory]);

  useEffect(() => {
    if (formik.values.location_id && formik.values.location_id !== storeReservation.location_id) {
      dispatch(setLocationId(formik.values.location_id));
    }
  }, [formik.values.location_id])
  return (
    <PageContainer
      topbar={
        <HorizontalStepper
          steps={STEPS?.map(s => t(s as string, keys))}
          bgColor="#6E082F"
          completedColor="#FFD600"
          upcomingColor="#FEE2E2"
          comingLabelColor="#FFFFFF"
          lineColor="#fff"
          completedCheckIconColor="#6E082F"
          stepNumberStyle={{ fontSize: "16px", fontFamily: "monospace", color: "#fff" }}
          activeStep={activeStep}
          onStepClick={(step) => setActiveStep(step)}
        />
      }
    >
      <Loader loading={loading} />
      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit}>
          <Button
            onClick={() => router.push("/julietnails")}
            className="flex items-center text-[#6E082F] my-4 hover:text-white font-medium cursor-pointer transition-all duration-200"
          >
            <KeyboardBackspaceIcon className="mr-1 size-4" />
            {t("back_to_home", keys)}
          </Button>
          {activeStep === 0 && (

            <> <Grid container spacing={4}>

              <Grid item xs={12} lg={6} xl={3}>
                <Box
                  display="flex"
                  flexDirection="column"
                  gap={2}
                  p={2}
                  sx={{ height: "350px" }}
                  border="1px solid #cccccc"
                  borderRadius={1}
                  boxShadow={1}
                  bgcolor="white"
                >
                  {/* <Box>
    <CustomFormLabel sx={{textTransform:"capitalize"}} required>{t("location_id", keys)}</CustomFormLabel>
    <CustomSelect
      fullWidth
      id="location_id"
      name="location_id"
      sx={{textTransform:"capitalize"}}
      value={formik.values.location_id}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={Boolean(formik.touched.location_id && formik.errors.location_id)}
      placeholder={t("type_here", keys)}
    >
      <MenuItem value="">
        <em>{t("select_branch", keys)}</em>
      </MenuItem>
      {branches?.map((location_id: any) => (
        <MenuItem key={location_id.id} value={location_id.id} sx={{textTransform:"capitalize"}}>
          {location_id.location_name}
        </MenuItem>
      ))}
    </CustomSelect>

    {formik.touched.location_id && formik.errors.location_id && (
      <FormHelperText error>{formik.errors.location_id}</FormHelperText>
    )}
  </Box> */}
                  <Box>
                    <CustomFormLabel required>{t("category", keys)}</CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      sx={{ textTransform: "capitalize" }}
                      value={newCategory}
                      displayEmpty
                      onChange={(e: any) => {
                        setNewCategory(e.target.value);
                        setNewService("");
                      }}
                      renderValue={(selected: string) => {
                        if (!selected) {
                          return <em>{t("select_category", keys)}</em>;
                        }
                        const selectedCategory = categories?.find(cat => cat.id === selected);
                        return selectedCategory ? selectedCategory.name : <em>{t("select_category", keys)}</em>;
                      }}
                    >
                      <MenuItem disabled value="">
                        <em>{t("select_category", keys)}</em>
                      </MenuItem>
                      {categories?.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id} sx={{ textTransform: "capitalize" }}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </CustomSelect>
                  </Box>

                  <Box>
                    <CustomFormLabel required>{t("service", keys)}</CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      displayEmpty
                      value={newService}
                      onChange={(e: any) => setNewService(e.target.value)}
                      disabled={!newCategory}
                      sx={{ textTransform: "capitalize" }}
                      renderValue={(selected: string) => {
                        if (!selected) {
                          return <em>{t("select_service", keys)}</em>;
                        }
                        const service = (servicesByCategory as any)[newCategory]?.find((s: any) => s.id === selected);
                        return service ? service.name : <em>{t("select_service", keys)}</em>;
                      }}
                    >
                      <MenuItem disabled value="">
                        <em>{t("select_service", keys)}</em>
                      </MenuItem>
                      {(servicesByCategory as any)[newCategory]
                        ?.filter((s: any) =>
                          !formik.values.reservation.some((b: any) => b.service_id === s.id)
                        )
                        ?.map((srv: any) => (
                          <MenuItem key={srv.id} value={srv.id} sx={{ textTransform: "capitalize" }}>
                            {srv?.name}
                          </MenuItem>
                        ))}
                    </CustomSelect>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{
                      height: 50,
                      textTransform: "none",
                      fontWeight: 600,
                      mt: 1,
                      borderRadius: 1,
                    }}
                    onClick={() => {
                      const updated = [
                        ...formik.values.reservation,
                        { category_id: newCategory, service_id: newService, quantity: 1 },
                      ];
                      updateReservationsAndTotal(updated);
                      setNewCategory("");
                      setNewService("");
                    }}
                    disabled={!newCategory || !newService}
                  >
                    {t("add_service", keys)}
                  </Button>
                </Box>

              </Grid>
              {formik.values.reservation?.length > 0 && <Grid item xs={12} lg={6} xl={3}>
                <Box
                  display="flex"
                  flexDirection="column"
                  gap={2}
                  p={2}
                  sx={{ minHeight: "350px" }}
                  border="1px solid #cccccc"
                  borderRadius={1}
                  boxShadow={1}
                  bgcolor="white"
                >
                  <Box>
                    <CustomFormLabel required>{t("date", keys)}</CustomFormLabel>
                    <LocalizationProvider>
                      <DatePicker
                        minDate={dayjs()}
                        value={formik.values.date ? dayjs(formik.values.date) : null}
                        onChange={(value: Dayjs | null) => {
                          formik.setFieldValue("date", value ? value.toDate() : null);
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: Boolean(formik.touched.date && formik.errors.date),
                            helperText: formik.touched.date && t(formik.errors.date as string, keys),
                            onBlur: formik.handleBlur,
                            name: "date",
                          },
                        }}
                        sx={{
                          marginRight: "8px",
                          "& .MuiOutlinedInput-root": {
                            height: "52px",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#CCCCCC",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#666666",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#2276FF",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                  <Box>
                    <CustomFormLabel required>{t("staff_member", keys)}</CustomFormLabel>
                    <CustomSelect
                      disabled={!formik.values.date}
                      fullWidth
                      id="staff_id"
                      name="staff_id"
                      value={formik.values.staff_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.staff_id && formik.errors.staff_id)}
                      displayEmpty
                      renderValue={(selected: string) =>
                        selected
                          ? staffMembers.find((staff) => staff.id === selected)?.first_name +
                          " " +
                          staffMembers.find((staff) => staff.id === selected)?.last_name
                          : t("select_staff", keys)
                      }
                    >
                      <MenuItem disabled value="">
                        <em>{t("select_staff", keys)}</em>
                      </MenuItem>
                      {staffMembers?.map((staff: any) => (
                        <MenuItem key={staff.id} value={staff.id}>
                          {staff.customer_first_name} {`${staff.first_name} ${staff?.last_name}`}
                        </MenuItem>
                      ))}
                    </CustomSelect>
                    {formik.touched.staff_id && formik.errors.staff_id && (
                      <FormHelperText error>{t(formik.errors.staff_id as string, keys)}</FormHelperText>
                    )}
                  </Box>

                  <Box>
                    <CustomFormLabel required>{t("time_slot", keys)}</CustomFormLabel>
                    <CustomSelect
                      disabled={!formik.values.date || !formik.values.staff_id}
                      fullWidth
                      id="time_slot"
                      name="time_slot"
                      displayEmpty
                      value={
                        formik.values.time_slot.start_time && formik.values.time_slot.end_time
                          ? JSON.stringify(formik.values.time_slot)
                          : ""
                      }
                      onChange={(e: React.ChangeEvent<{ value: unknown }>) => {
                        const selectedValue = e.target.value as string;
                        formik.setFieldValue("time_slot", selectedValue ? JSON.parse(selectedValue) : "");
                      }}
                      onBlur={formik.handleBlur}
                      error={Boolean(formik.touched.time_slot && formik.errors.time_slot)}
                      renderValue={(selected: any) => {
                        try {
                          const parsed = JSON.parse(selected);
                          const start = moment.utc(parsed.start_time);
                          const end = moment.utc(parsed.end_time);
                          return `${start.format("hh:mm A")} - ${end.format("hh:mm A")}`;
                        } catch {
                          return <em>{t("select_time_slot", keys)}</em>;
                        }
                      }}
                    >
                      <MenuItem disabled value="">
                        <em>{t("select_time_slot", keys)}</em>
                      </MenuItem>
                      {timeSlots.map((slot: any, index: number) => {
                        if (index === timeSlots.length - 1) return null;

                        const start = moment.utc(slot);
                        const end = moment.utc(timeSlots[index + 1]);

                        if (!end.isValid()) return null;

                        const value = JSON.stringify({
                          start_time: start.toISOString(),
                          end_time: end.toISOString(),
                        });

                        const label = `${start.format("hh:mm A")} - ${end.format("hh:mm A")}`;

                        return (
                          <MenuItem key={index} value={value}>
                            {label}
                          </MenuItem>
                        );
                      })}
                    </CustomSelect>

                    {formik.touched.time_slot && formik.errors.time_slot && typeof formik.errors.time_slot === "object" && (
                      <FormHelperText error>
                        {t((formik.errors.time_slot as any).start_time as string, keys) ||
                          t((formik.errors.time_slot as any).end_time as string, keys) ||
                          t("time_slot_is_required", keys)}
                      </FormHelperText>
                    )}
                  </Box>
                </Box>
              </Grid>}

              <Grid item xs={12} sx={{ mt: { xl: "0px", xs: "10px" } }} lg={6}>
                {formik.values.reservation.map((item: any, idx: number) => {
                  const cat = categories.find((c: any) => c.id === item.category_id);
                  const srv = servicesByCategory?.[item.category_id]?.find((s: any) => s.id === item.service_id);

                  if (!cat || !srv) return null;

                  return (
                    <Box key={idx} mb={2}>
                      <Card
                        variant="outlined"
                        className="shadow-sm"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          borderRadius: 2,
                          '&:hover': {
                            boxShadow: 3,
                            borderColor: 'primary.main',
                          },
                        }}
                      >

                        <Box flexGrow={1}>
                          <Typography variant="subtitle1" sx={{ textTransform: "capitalize" }} fontWeight={600}>
                            {srv.name}
                          </Typography>
                          <Typography sx={{ textTransform: "capitalize", fontSize: "12px", mt: "-4px", mb: "5px" }}>
                            {cat.name}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ${(srv.price).toFixed(2)}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" mr={4} gap={1}>
                          <Tooltip title={t("decrease_quantity", keys)}>
                            <IconButton
                              size="small"
                              sx={{
                                backgroundColor: '#fff',
                                '&:hover': { backgroundColor: '#e5e7eb' },
                                boxShadow: 1,
                                borderRadius: '50%',
                                p: 0.5,
                              }}
                              onClick={() => {
                                const next = formik.values.reservation.map((res, i) =>
                                  i === idx
                                    ? { ...res, quantity: Math.max(1, res.quantity - 1) }
                                    : res
                                );
                                updateReservationsAndTotal(next);
                              }}

                            >
                              <IconMinus size={18} />
                            </IconButton>
                          </Tooltip>

                          <Typography mx={1} fontWeight={600}>
                            {item.quantity}
                          </Typography>

                          <Tooltip title={t("increase_quantity", keys)}>
                            <IconButton
                              size="small"
                              sx={{
                                backgroundColor: '#fff',
                                '&:hover': { backgroundColor: '#e5e7eb' },
                                boxShadow: 1,
                                borderRadius: '50%',
                                p: 0.5,
                              }}
                              onClick={() => {
                                const next = formik.values.reservation.map((res, i) =>
                                  i === idx
                                    ? { ...res, quantity: res.quantity + 1 }
                                    : res
                                );
                                updateReservationsAndTotal(next);
                              }}

                            >
                              <IconPlus size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        <Tooltip title={t("remove_item", keys)}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              const removedItem = formik.values.reservation[idx];
                              const next = formik.values.reservation.filter((_, i) => i !== idx);
                              updateReservationsAndTotal(next);
                              dispatch(removeItem(removedItem.service_id));
                            }}
                          >
                            <IconX size={20} />
                          </IconButton>
                        </Tooltip>

                      </Card>
                    </Box>
                  );
                })}

                {formik.values?.reservation?.length > 0 && <Typography variant="h6" fontWeight={700} textAlign="right" mt={2}>
                  {t("total", keys)}: ${formik.values.total_price.toFixed(2)}
                </Typography>
                }
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography sx={{ fontWeight: "700", fontSize: "16px" }}>
                  {t("customer_details", keys)}
                </Typography>
                <Box>
                  <CustomFormLabel required>{t("customer_first_name", keys)}</CustomFormLabel>
                  <CustomTextField
                    fullWidth
                    placeholder={t("type_here", keys)}
                    id="customer_first_name"
                    name="customer_first_name"
                    value={formik.values.customer_first_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.customer_first_name && Boolean(formik.errors.customer_first_name)}
                    helperText={formik.touched.customer_first_name && t(formik.errors.customer_first_name as string, keys)}
                  />
                </Box>
                <Box>
                  <CustomFormLabel>{t("customer_last_name", keys)}</CustomFormLabel>
                  <CustomTextField
                    fullWidth
                    placeholder={t("type_here", keys)}
                    id="customer_last_name"
                    name="customer_last_name"
                    value={formik.values.customer_last_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.customer_last_name && Boolean(formik.errors.customer_last_name)}
                    helperText={formik.touched.customer_last_name && t(formik.errors.customer_last_name as string, keys)}
                  />
                </Box>
                <Box>
                  <CustomFormLabel required>{t("customer_email", keys)}</CustomFormLabel>
                  <CustomTextField
                    fullWidth
                    id="customer_email"
                    name="customer_email"
                    type="email"
                    placeholder={t("type_here", keys)}
                    value={formik.values.customer_email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.customer_email && Boolean(formik.errors.customer_email)}
                    helperText={formik.touched.customer_email && t(formik.errors.customer_email as string, keys)}
                  />
                </Box>
                <Grid item xs={12}>
                  <CustomFormLabel required>{t("customer_phone", keys)}</CustomFormLabel>
                  <CustomTextField
                    fullWidth
                    id="customer_phone"
                    name="customer_phone"
                    placeholder={t("type_here", keys)}
                    value={formik.values.customer_phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.customer_phone && Boolean(formik.errors.customer_phone)}
                    helperText={formik.touched.customer_phone && t(formik.errors.customer_phone as string, keys)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomFormLabel>{t("customer_altPhone", keys)}</CustomFormLabel>
                  <CustomTextField
                    fullWidth
                    placeholder={t("type_here", keys)}
                    id="customer_altPhone"
                    name="customer_altPhone"
                    value={formik.values.customer_altPhone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </Grid>
              </Grid>
            </Grid>

            </>
          )}


          {activeStep === 1 && (

            <>
              <Grid container spacing={2}>
                <Grid item xl={6} xs={12}>
                  <Card sx={{ p: 3, mt: 4 }}>
                    <Typography variant="h4" fontWeight={600} gutterBottom sx={{ display: "flex", justifyContent: "center", alignItems: "center", textTransform: "capitalize" }}>
                      {t("summary", keys)}
                    </Typography>
                    <Divider />

                    <Box sx={{ mb: 2, borderRadius: "0px" }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ textTransform: "capitalize" }} color="primary">
                        {t("booking_information", keys)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", textTransform: "capitalize", justifyContent: "space-between", py: 1 }}>
                      <Typography variant="body2" color="text.secondary">{t("date", keys)}</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formik.values.date ? new Date(formik.values.date).toLocaleDateString() : "-"}
                      </Typography>
                    </Box>
                    {formik.values.time_slot?.start_time && formik.values.time_slot?.end_time && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("time_slot", keys)}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {moment(formik.values.time_slot.start_time).format("HH:MM A")} - {moment(formik.values.time_slot.end_time).format("HH:MM A")}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, textTransform: "capitalize" }}>
                      <Typography variant="body2" color="text.secondary">{t("staff_member", keys)}</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {(() => {
                          const staff = staffMembers?.find(s => s.id === formik.values.staff_id);
                          return staff ? `${staff.first_name} ${staff.last_name || ""}` : "-";
                        })()}
                      </Typography>
                    </Box>
                    <Divider />

                    <Box sx={{ mt: 3, mb: 2, borderRadius: "0px", textTransform: "capitalize" }}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary">
                        {t("booking_services", keys)}
                      </Typography>
                    </Box>

                    {formik.values.reservation.map((svc: any, idx) => {
                      const service = servicesByCategory[svc.category_id]?.find(s => s.id === svc.service_id)?.name || "";
                      return (
                        <Box key={idx} sx={{ display: "flex", textTransform: "capitalize", justifyContent: "space-between", borderRadius: "0px", py: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                            {service}
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>x {svc.quantity}</Typography>
                        </Box>
                      );
                    })}
                    <Divider />
                    <Box sx={{ mt: 3, mb: 2, borderRadius: "0px", textTransform: "capitalize" }}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary">
                        {t("customer_information", keys)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, textTransform: "capitalize" }}>
                      <Typography variant="body2" color="text.secondary">{t("customer_first_name", keys)}</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formik.values.customer_first_name} {formik.values.customer_last_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, textTransform: "capitalize" }}>
                      <Typography variant="body2" color="text.secondary">{t("customer_email", keys)}</Typography>
                      <Typography variant="body2" fontWeight={500}>{formik.values.customer_email}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, textTransform: "capitalize" }}>
                      <Typography variant="body2" color="text.secondary">{t("customer_phone", keys)}</Typography>
                      <Typography variant="body2" fontWeight={500}>{formik.values.customer_phone}</Typography>
                    </Box>

                    {formik.values.customer_altPhone && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, textTransform: "capitalize" }}>
                        <Typography variant="body2" color="text.secondary">{t("customer_altPhone", keys)}</Typography>
                        <Typography variant="body2" fontWeight={500}>{formik.values.customer_altPhone}</Typography>
                      </Box>
                    )}

                    <Divider />

                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 2, alignItems: "center" }}>
                      <Typography variant="body2" fontWeight={500} sx={{ textTransform: "capitalize" }}>
                        {t("enter_giftcard_code", keys)}
                      </Typography>
                      <TextField
                        size="small"
                        name="coupon_code"
                        value={formik.values.coupon_code || ""}
                        onChange={formik.handleChange}
                        placeholder={t("giftcard_code", keys)}
                        variant="outlined"
                        sx={{ ml: 2, width: "60%" }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, textTransform: "capitalize" }}>
                      <Typography variant="body2" fontWeight={700} color="text.secondary">{t("total", keys)}</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        ${formik.values.total_price}
                      </Typography>
                    </Box>
                    {(formik.values.redeem_points || formik.values.coupon_code) && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, textTransform: "capitalize" }}>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">{t("discounted_amount", keys)}</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          ${formik.values.final_price}
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Grid>
                {(
                  customerPointsData?.availablePoints > 0 &&
                  <Grid item xl={6} xs={12}>
                    <Card sx={{ p: 3, mt: 4 }}>
                      <Box sx={{ mt: 3, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ textTransform: "capitalize" }}>
                          {t("loyalty_points", keys)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                        <Typography variant="body2" color="text.secondary">{t("available_points", keys)}</Typography>
                        <Typography variant="body2" fontWeight={500}>{customerPointsData.availablePoints}</Typography>
                      </Box>
                      {/* <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                        <Typography variant="body2" color="text.secondary">  {t("each_point_worth", keys)}</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          ${customerPointsData.discountPerPoint.toFixed(2)}
                        </Typography>
                      </Box> */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                        <Typography variant="body2" color="text.secondary">{t("max_redeemable_discount", keys)}</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {customerPointsData.max_redeem_pct}% (${(formik.values.total_price * (customerPointsData.max_redeem_pct / 100)).toFixed(2)})
                        </Typography>
                      </Box>

                      <Box>
                        <CustomFormLabel>{t("enter_loyalty_points_to_use", keys)}</CustomFormLabel>
                        <CustomTextField
                          fullWidth
                          type="number"
                          name="redeem_points"
                          value={formik.values.redeem_points}
                          onChange={(e: any) => {
                            if (finalvalue && finalvalue !== formik.values.total_price) {
                              ToastErrorMessage("gift_card_already_applied_loyalty_points_not_allowed");
                              formik.setFieldValue("redeem_points", 0);
                              return;
                            }

                            const inputPoints = parseFloat(e.target.value || "0");

                            const maxAllowedPoints = Math.floor(
                              (formik.values.total_price * (customerPointsData.max_redeem_pct / 100)) /
                              customerPointsData.discountPerPoint
                            );

                            const finalPoints = Math.min(inputPoints, customerPointsData.availablePoints, maxAllowedPoints);

                            const discount = finalPoints * customerPointsData.discountPerPoint;
                            const finalPrice = finalPoints > 0
                              ? parseFloat((formik.values.total_price - discount).toFixed(2))
                              : formik.values.total_price;

                            formik.setFieldValue("redeem_points", finalPoints);
                            formik.setFieldValue("final_price", finalPrice);
                          }}
                          inputProps={{ min: 0 }}
                          sx={{ mt: 2 }}
                        />

                      </Box>

                    </Card>
                  </Grid>

                )}
                {!router?.query.id && (
                  <Grid item xs={12} lg={6}>
                    <Box sx={{ p: 3, mt: 4 }}>
                      <FormControl component="fieldset" sx={{ minWidth: { sm: '200px' } }}>
                        <CustomFormLabel required sx={{ mb: 1, display: 'block' }}>
                          {t("choose_payment_method", keys)}
                        </CustomFormLabel>
                        <RadioGroup
                          aria-label="payment_method"
                          name="payment_method"
                          value={formik.values.payment_method}
                          onChange={formik.handleChange}
                          sx={{ display: 'flex', flexDirection: 'column' }}
                        >
                          <FormControlLabel value="card" control={<Radio />} label={t("pay_with_card", keys)} />
                          <FormControlLabel value="qr" control={<Radio />} label={t("pay_with_qr_code_scan", keys)} />
                          <FormControlLabel value="cash" control={<Radio />} label={t("cash", keys)} />
                        </RadioGroup>
                      </FormControl>
                    </Box>
                  </Grid>
                )}
              </Grid>

            </>
          )}
          <Box mt={4} display="flex" justifyContent="space-between">
            {activeStep > 0 && (
              <Button
                variant="outlined"
                sx={{
                  px: 6,
                  py: 1,
                  width: "172px",
                  height: "56px",
                  fontSize: "16px",
                }}
                onClick={handleBackStep}
              >
                {t("back", keys)}
              </Button>
            )}

            <Box flexGrow={1} />

            {activeStep < STEPS.length && (
              <Button
                variant="contained"
                hidden={activeStep === 1 && formik.values.payment_method !== "cash"}
                disabled={formik.values?.reservation?.length === 0}
                sx={{
                  px: 6,
                  py: 1,
                  width: "172px",
                  height: "56px",
                  fontSize: "16px",
                }}
                onClick={handleNextStep}
              >
                {activeStep === 0 ? t("next", keys) : t("submit", keys)}
              </Button>
            )}
          </Box>

        </form>
      </FormikProvider>
      <CheckoutFormDialog
        open={formik.values.payment_method === "card"}
        onClose={() => { formik.setFieldValue("payment_method", "cash") }}
        amount={formik.values.final_price}
        onPaymentSuccess={handleStripeSuccess}
      />
      <PaymentQrDialog
        open={formik.values.payment_method === "qr"}
        onClose={() => { formik.setFieldValue("payment_method", "cash") }}
        reservation={formik.values}
        setPaymentSuccessCheck={setPaymentSuccess}
      />
    </PageContainer >
  );
};

Appointments.layout = "Blank";
export default Appointments;
