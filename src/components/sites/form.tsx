// import {
//     Autocomplete,
//     Box,
//     Button,
//     FormControl,
//     FormHelperText,
//     IconButton,
//     InputLabel,
//     MenuItem,
//     Select,
//     Switch,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     TextField,
//     Typography,
//   } from "@mui/material";
//   import Grid from "@mui/material/Grid2";
//   import { useRouter } from "next/router";
//   import React, { useEffect, useState } from "react";
//   import axios, { AxiosError } from "axios";
//   import { FieldArray, useFormik } from "formik";
//   import { signOut, useSession } from "next-auth/react";
//   import { useTranslation } from "react-i18next";
//   import PhoneInput from "react-phone-number-input";
//   import "react-phone-number-input/style.css";
//   const countryFlagEmoji = require("country-flag-emoji");
//   import { toast } from "sonner";
//
//   const Flag = require("react-world-flags");
//   import { AlertInterface, Company, LatLng } from "@/types/admin/types";
//   import PageContainer from "@/components/container/PageContainer";
//   import Loader from "@/components/loader/Loader";
//   import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
//   import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
//   import Alert from "@/components/alert/Alert";
//   import HorizontalStepper from "@/components/stepper/HorizontalStepper";
//   import * as yup from "yup";
//   import CustomSwitch from "@/components/forms/theme-elements/CustomSwitch";
//   import Image from "next/image";
//   import Map from "@/components/map/Map";
//   import { useTailwind } from "@/components/providers/TailwindProvider";
//   import { IconBuilding, IconPlus, IconTrash } from "@tabler/icons-react";
//   import FiscalUploader from "@/components/uploaders/FiscalUploader";
//   import AddIcon from '@mui/icons-material/Add';
//   import DeleteIcon from '@mui/icons-material/Delete';

//   type TimeSlot = {
//     schedule_from: string; // Expected to be a string, e.g., '09:00'
//     schedule_to: string;   // Expected to be a string, e.g., '17:00'
//     enabled: boolean;      // Whether the time slot is enabled
//   };

//   type Day = {
//     dayId: number;        // Identifier for the day
//     name: string;         // Name of the day
//     timeSlots: TimeSlot[]; // Array of time slots
//   };

//   type Schedule = Day[];

//   const ManageLocations = () => {
//     const router = useRouter();
//     const { setHeaderContent, setHeaderTitle } = useTailwind();
//     const { data: session, status }: any = useSession({
//       required: true,
//     });
//     const { t } = useTranslation();
//     const [action, setAction] = useState("create");
//     const [openMapModal, setOpenMapModal] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [alert, setAlert] = useState<AlertInterface | null>(null);
//     const [languages, setLanguages] = useState([]);
//     const [timeZone, setTimeZone] = useState('GMT'); // Default time zone
//     const [timeFormat, setTimeFormat] = useState('24-hour'); // Default time format // Default time format
//     const timeZones = [
//       'America/New_York',
//       'Europe/London',
//       'Asia/Kolkata',
//       'Australia/Sydney',
//       'Europe/Berlin',
//       'Africa/Cairo',
//       'America/Los_Angeles',
//     ];
//     const [existingDaysOfWeek, setExistingDaysOfWeek] = useState([
//       { dayId: 0, name: 'Sunday', timeSlots: [{ schedule_from: '', schedule_to: '', enabled: false }] },
//       { dayId: 1, name: 'Monday', timeSlots: [{ schedule_from: '', schedule_to: '', enabled: false }] },
//       { dayId: 2, name: 'Tuesday', timeSlots: [{ schedule_from: '', schedule_to: '', enabled: false }] },
//       { dayId: 3, name: 'Wednesday', timeSlots: [{ schedule_from: '', schedule_to: '', enabled: false }] },
//       { dayId: 4, name: 'Thursday', timeSlots: [{ schedule_from: '', schedule_to: '', enabled: false }] },
//       { dayId: 5, name: 'Friday', timeSlots: [{ schedule_from: '', schedule_to: '', enabled: false }] },
//       { dayId: 6, name: 'Saturday', timeSlots: [{ schedule_from: '', schedule_to: '', enabled: false }] },
//     ]);
//     const [mapCoordinates, setMapCoordinates] = useState<LatLng>({
//       lat: 40.748817,
//       lng: -73.985428,
//     });
//     const steps = ["Basic Information", "Working Hours"];
//     const [activeStep, setActiveStep] = useState(0);
//     const [location, setLocation] = useState({
//       location_name: '',
//       location_number: '',
//       country: '',
//       street: '',
//       city: '',
//       postcode: '',
//       state: '',
//       location_email: '',
//       location_phone: '',
//       client_language_id: '',
//       location_timezone: 'America/New_York',
//       location_24_hours: 'No',
//       days: existingDaysOfWeek,
//     },);

//     const validationSchema = yup.object({
//       location_name: yup.string().required('Location Name is required'),
//       location_number: yup.string().required('Location Number is required'),
//       country: yup.string().required('Country is required'),
//       street: yup.string().required('Street is required'),
//       city: yup.string().required('City is required'),
//       postcode: yup.string().required('Postcode is required'),
//       state: yup.string(),
//       location_email: yup.string().email('Invalid email').required('Email is required'),
//       location_phone: yup.string().required('Phone is required'),
//       client_language_id: yup.string().required('Language is required'),
//       location_timezone: yup.string().required('Time Zone is required'),
//       location_24_hours: yup.string().required('Required'),
//     });

//     const getAddressComponent = (
//       place: any,
//       componentType: any,
//       longNameFlag: any
//     ) => {
//       const addressComponents = place.address_components;

//       for (let i = 0; i < addressComponents.length; i++) {
//         const component = addressComponents[i];
//         const types = component.types;

//         if (types.indexOf(componentType) !== -1) {
//           return longNameFlag ? component.long_name : component.short_name;
//         }
//       }

//       return "";
//     };
//     const handleClientlocationSet = (newCoordinates: LatLng, place: any) => {
//       setMapCoordinates(newCoordinates);
//       formik.setFieldValue("latitude", newCoordinates.lat);
//       formik.setFieldValue("longitude", newCoordinates.lng);

//       if (place?.address_components) {
//         const arr = [
//           "landmark",
//           "route",
//           "neighborhood",
//           "sublocality_level_2",
//           "sublocality_level_1",
//           "street_number",
//         ];
//         const address: any = [];
//         for (var i = 0; i < arr.length; i++) {
//           var addr = getAddressComponent(place, arr[i], true);
//           if (addr != "") {
//             address.push(addr);
//           }
//         }
//         const city =
//           getAddressComponent(place, "administrative_area_level_3", true) ||
//           getAddressComponent(place, "administrative_area_level_2", true);
//         const state = getAddressComponent(
//           place,
//           "administrative_area_level_1",
//           true
//         );
//         const postCode = getAddressComponent(place, "postal_code", true);
//         formik.setFieldValue(
//           "street",
//           address.length > 1
//             ? address.slice(0, -1).join(", ") + " " + address[address.length - 1]
//             : address[0]
//         );
//         formik.setFieldValue("city", city);
//         formik.setFieldValue("postcode", postCode);
//         formik.setFieldValue("state", state);
//         formik.setFieldValue(
//           "country",
//           getAddressComponent(place, "country", true)
//         );
//       }
//       handleClose();
//     };
//     const handleClose = () => {
//       setOpenMapModal(false);
//     };

//     const fethLocation = async (id: number) => {
//       try {
//         const response = await axios.post("/api/", {
//           id,
//         });
//         formik.setValues(response.data);
//       } catch (error) {
//         if (error instanceof AxiosError) {
//           toast.error(error.response?.data?.message || error.message);
//         } else {
//           toast.error('An unknown error occurred');
//         }
//       }
//     };
//     useEffect(() => {
//       if (router.query.action === "view" && router.query.id) {
//         setAction("view");
//         fethLocation((router.query.id as string));
//       }

//       setHeaderContent(
//         <Box className="flex gap-2 items-center">
//           <IconBuilding className="text-primary-main" />
//           <Typography>
//             / Clients /{" "}
//             {router.query.action === "create" ? "Add Client" : "Edit Client"}
//           </Typography>
//         </Box>
//       );
//       setHeaderTitle("Clients");
//     }, [router]);

//     const fetchLanguages = async () => {
//       try {
//         const response = await axios.get("/api/languages/getlanguages");
//         setLanguages(response.data);
//       } catch (error) {
//         console.error("Failed to fetch languages:", error);
//       }
//     };

//     useEffect(() => {
//       fetchLanguages();
//     }, []);

//     const formik = useFormik({
//       initialValues: location,
//       validationSchema: validationSchema,
//       validateOnChange: false,
//       validateOnBlur: true,
//       onSubmit: (values) => {
//         console.log("hello")
//         console.log(values)
//         let url = "/api/";
//         if (action == "view") {
//           url = "/api/";
//         }
//         const manageLocation = async () => {
//           if (activeStep < steps.length - 1)
//             return setActiveStep((prev) => prev + 1);

//           try {
//             setLoading(true);
//             const response = await axios.post(url, { ...values });
//             setAlert({
//               open: true,
//               title: t("success") ?? "",
//               description:
//                 action == "create"
//                   ? t("client_created_successfully") ?? ""
//                   : t("client_updated_successfully") ?? "",
//               callback: () => {
//                 setAlert({ open: false });
//                 router.push({
//                   pathname: "/admin/clients",
//                 });
//               },
//             });
//           } catch (error) {
//             if (error instanceof AxiosError) {
//               toast.error(error.response?.data?.message || error.message);
//             } else {
//               toast.error('An unknown error occurred');
//             }
//           } finally {
//             setLoading(false);
//           }
//         };
//         manageLocation();
//       },
//     });

//     useEffect(() => {
//       if (session && !session?.user?.navigation?.includes("/clients")) {
//         signOut({ redirect: true, callbackUrl: "/admin/login" });
//       }
//     }, [session]);

//     const handleAddRow = (dayId: number) => {
//       const newDays = [...formik.values.schedule];
//       const dayIndex = newDays.findIndex(day => day.dayId === dayId);
//       newDays[dayIndex].timeSlots.push({ schedule_from: '', schedule_to: '', enabled: false });
//       formik.setFieldValue('schedule', newDays);
//     };

//     const handleDeleteRow = (dayId: number, slotIndex: number) => {
//       const newDays = [...formik.values.schedule];
//       const dayIndex = newDays.findIndex(day => day.dayId === dayId);
//       if (newDays[dayIndex].timeSlots.length > 1) {
//         newDays[dayIndex].timeSlots.splice(slotIndex, 1);
//         formik.setFieldValue('schedule', newDays);
//       }
//     };

//     const handleSwitchChange = (dayId: number, slotIndex: number) => {
//       const currentValue = formik.values.schedule.find(day => day.dayId === dayId)?.timeSlots[slotIndex]?.enabled;
//       if (currentValue !== undefined) {
//         updateTimeSlot(dayId, slotIndex, 'enabled', !currentValue);
//       }
//     };

//     const updateTimeSlot = (
//       dayId: number,
//       slotIndex: number,
//       field: keyof TimeSlot,
//       value: string | boolean
//     ) => {
//       const newDays = [...formik.values.schedule];
//       const dayIndex = newDays.findIndex(day => day.dayId === dayId);

//       if (dayIndex !== -1 && slotIndex >= 0 && slotIndex < newDays[dayIndex].timeSlots.length) {
//         newDays[dayIndex].timeSlots[slotIndex][field] = value; // Ensure correct assignment
//         formik.setFieldValue('schedule', newDays);
//       }
//     };

//     // Function to handle time changes
//     const handleTimeChange = (dayId: number, slotIndex: number, field: keyof TimeSlot, newValue: string) => {
//       updateTimeSlot(dayId, slotIndex, field, newValue);
//     };

//     const renderTimePicker = (
//       dayId: number,
//       slotIndex: number,
//       field: keyof TimeSlot
//     ) => {
//       const value = formik.values.schedule[dayId].timeSlots[slotIndex][field];

//       const handleTimeChangeWrapper = (newValue: string) => {
//         handleTimeChange(dayId, slotIndex, field, newValue);
//       };

//       if (formik.values.timeFormat === '12-hour') {
//         return (
//           <TextField
//             type="time"
//             value={value}
//             onChange={(e) => handleTimeChangeWrapper(e.target.value)}
//             inputProps={{ step: 300 }} // 5 min interval
//           />
//         );
//       } else {
//         return (
//           <TextField
//             type="text"
//             value={value}
//             placeholder="hh:mm"
//             onChange={(e) => handleTimeChangeWrapper(e.target.value)}
//           />
//         );
//       }
//     };

//     return (
//       <PageContainer
//         topbar={<HorizontalStepper steps={steps} activeStep={activeStep} />}
//       >
//         <Loader loading={loading} />
//         <Alert alert={alert} />
//         <form encType="multipart/form-data" onSubmit={formik.handleSubmit}>
//           {session && session?.user?.navigation?.includes("/clients") ? (
//             <Box mt={1} sx={{ overflowX: "hidden" }}>
//               {activeStep === 0 && (
//                 <Grid container spacing={4} columns={{ xs: 4, lg: 8 }}>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>
//                         {t("location_name")}
//                       </CustomFormLabel>
//                       <CustomTextField
//                         fullWidth
//                         id="location_name"
//                         name="location_name"
//                         value={formik.values.location_name}
//                         onChange={formik.handleChange}
//                         onBlur={formik.handleBlur}
//                         placeholder={t("type_here")}
//                         error={
//                           formik.touched.location_name &&
//                           formik.errors.location_name
//                         }
//                         helperText={
//                           formik.touched.location_name &&
//                           formik.errors.location_name
//                         }
//                       />
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>
//                         {t("location_number")}
//                       </CustomFormLabel>
//                       <CustomTextField
//                         fullWidth
//                         id="location_number"
//                         name="location_number"
//                         value={formik.values.location_number}
//                         onChange={formik.handleChange}
//                         onBlur={formik.handleBlur}
//                         placeholder={t("type_here")}
//                         error={
//                           formik.touched.location_number &&
//                           Boolean(formik.errors.location_number)
//                         }
//                         helperText={
//                           formik.touched.location_number &&
//                           formik.errors.location_number
//                         }
//                       />
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>{t("country")}</CustomFormLabel>
//                       <FormControl
//                         fullWidth
//                         error={
//                           formik.touched.country && Boolean(formik.errors.country)
//                         }
//                       >
//                         <Autocomplete
//                           id="combo-box-demo"
//                           options={countryFlagEmoji.list}
//                           value={
//                             countryFlagEmoji.list.find(
//                               (option: Record<string, any>) =>
//                                 option.name === formik.values.country
//                             ) || null
//                           }
//                           getOptionLabel={(option) => option.name}
//                           onChange={(event, newValue) => {
//                             formik.setFieldValue(
//                               "country",
//                               newValue ? newValue.name : ""
//                             );
//                           }}
//                           onBlur={() => formik.setFieldTouched("country", true)}
//                           renderInput={(params) => (
//                             <CustomTextField {...params} fullWidth />
//                           )}
//                           renderOption={(props, option) => (
//                             <li {...props}>{option.name}</li>
//                           )}
//                         />

//                         {formik.touched.country && formik.errors.country && (
//                           <FormHelperText>
//                             {String(formik.errors.country)}
//                           </FormHelperText>
//                         )}
//                       </FormControl>
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>{t("street")}</CustomFormLabel>
//                       <CustomTextField
//                         fullWidth
//                         id="street"
//                         name="street"
//                         value={formik.values.street}
//                         onChange={formik.handleChange}
//                         onBlur={formik.handleBlur}
//                         placeholder={t("type_here")}
//                         error={
//                           formik.touched.street && Boolean(formik.errors.street)
//                         }
//                         helperText={formik.touched.street && formik.errors.street}
//                       />
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 2 }}>
//                     <Box>
//                       <CustomFormLabel>{t("select_location")}</CustomFormLabel>
//                       <Button
//                         variant="outlined"
//                         onClick={() => setOpenMapModal(true)}
//                       >
//                         <Image
//                           src={"/img/map.png"}
//                           width={25}
//                           height={25}
//                           alt=""
//                         />
//                       </Button>
//                       {openMapModal && (
//                         <Map
//                           initialValue={mapCoordinates}
//                           open={openMapModal}
//                           setMapCoordinates={handleClientlocationSet}
//                           handleClose={() => setOpenMapModal(false)}
//                         />
//                       )}
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>{t("city")}</CustomFormLabel>
//                       <CustomTextField
//                         fullWidth
//                         id="city"
//                         name="city"
//                         value={formik.values.city}
//                         onChange={formik.handleChange}
//                         onBlur={formik.handleBlur}
//                         placeholder={t("type_here")}
//                         error={formik.touched.city && Boolean(formik.errors.city)}
//                         helperText={formik.touched.city && formik.errors.city}
//                       />
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>{t("postcode")}</CustomFormLabel>
//                       <CustomTextField
//                         fullWidth
//                         id="postcode"
//                         name="postcode"
//                         value={formik.values.postcode}
//                         onChange={formik.handleChange}
//                         onBlur={formik.handleBlur}
//                         placeholder={t("type_here")}
//                         error={
//                           formik.touched.postcode &&
//                           Boolean(formik.errors.postcode)
//                         }
//                         helperText={
//                           formik.touched.postcode && formik.errors.postcode
//                         }
//                       />
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel>{t("state")}</CustomFormLabel>
//                       <CustomTextField
//                         fullWidth
//                         id="state"
//                         name="state"
//                         value={formik.values.state}
//                         onChange={formik.handleChange}
//                         onBlur={formik.handleBlur}
//                         placeholder={t("type_here")}
//                         error={
//                           formik.touched.state && Boolean(formik.errors.state)
//                         }
//                         helperText={formik.touched.state && formik.errors.state}
//                       />
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>{t("email")}</CustomFormLabel>
//                       <CustomTextField
//                         fullWidth
//                         id="location_email"
//                         name="location_email"
//                         value={formik.values.location_email}
//                         onChange={formik.handleChange}
//                         onBlur={formik.handleBlur}
//                         placeholder={t("type_here")}
//                         error={
//                           formik.touched.location_email &&
//                           Boolean(formik.errors.location_email)
//                         }
//                         helperText={
//                           formik.touched.location_email &&
//                           formik.errors.location_email
//                         }
//                       />
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>
//                         {t("phone_number")}
//                       </CustomFormLabel>
//                       <PhoneInput
//                         defaultCountry="US"
//                         style={{
//                           height: "45px",
//                           border: "1px solid #dfe5ef",
//                           borderRadius: "10px",
//                         }}
//                         id="mobile"
//                         placeholder="+385 1 234 5201"
//                         label="location_phone Number"
//                         value={formik.values.location_phone as any}
//                         onChange={(location_phone) =>
//                           formik.setFieldValue("location_phone", location_phone)
//                         }
//                         onBlur={() =>
//                           formik.setFieldTouched("location_phone", true)
//                         }
//                       />
//                       {formik.touched.location_phone &&
//                       formik.errors.location_phone ? (
//                         <Typography variant="body2" color="error">
//                           {typeof formik.errors.location_phone === "string"
//                             ? formik.errors.location_phone
//                             : ""}
//                         </Typography>
//                       ) : null}
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12, lg: 3 }}>
//                     <Box>
//                       <CustomFormLabel required>{t("language")}</CustomFormLabel>
//                       <Select
//                         fullWidth
//                         labelId="demo-simple-select-label"
//                         id="client_language_id"
//                         value={formik.values.client_language_id}
//                         placeholder="Select Language"
//                         onChange={(e) =>
//                           formik.setFieldValue(
//                             "client_language_id",
//                             e.target.value
//                           )
//                         }
//                         onBlur={() =>
//                           formik.setFieldTouched("client_language_id", true)
//                         }
//                       >
//                         {
//                           languages.map((language: any) => (
//                             <MenuItem key={language.id} value={language.id}>
//                               {language.languages.language_name}{" "}
//                               {/* Display the language name */}
//                             </MenuItem>
//                           ))
//                         }
//                       </Select>
//                       {formik.touched.client_language_id &&
//                       formik.errors.client_language_id ? (
//                         <Typography variant="body2" color="error">
//                           {typeof formik.errors.client_language_id === "string"
//                             ? formik.errors.client_language_id
//                             : ""}
//                         </Typography>
//                       ) : null}
//                     </Box>
//                   </Grid>
//                 </Grid>
//               )}

//               {activeStep === 1 && <Box><Grid container spacing={4} columns={{ xs: 12 }}>
//               <Grid size={{ xs: 12 }}>
//               <Box sx={{ padding: 2, border: '1px solid #ccc', borderRadius: '8px' }}>
//       <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
//         <FormControl fullWidth>
//           <InputLabel>Time Zone</InputLabel>
//           <Select
//             name="timeZone"
//             value={formik.values.location_timezone}
//             onChange={formik.handleChange}
//             error={formik.touched.location_timezone && Boolean(formik.errors.location_timezone)}
//           >
//             {timeZones.map((zone) => (
//               <MenuItem key={zone} value={zone}>
//                 {zone}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         <FormControl fullWidth>
//           <InputLabel>Time Format</InputLabel>
//           <Select
//             labelId="location-24-hours-label"
//             name="location_24_hours"
//             value={formik.values.location_24_hours}
//             onChange={formik.handleChange}
//             error={formik.touched.location_24_hours && Boolean(formik.errors.location_24_hours)}
//           >
//             <MenuItem value="Yes">Yes</MenuItem>
//             <MenuItem value="No">No</MenuItem>
//           </Select>
//         </FormControl>
//       </Box>

//       <FieldArray name="days">
//           {() => (
//       <TableContainer>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell>Day</TableCell>
//               <TableCell>Open Time</TableCell>
//               <TableCell>Close Time</TableCell>
//               <TableCell>Enabled</TableCell>
//               <TableCell>Action</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {formik.values.schedule.map((day) => (
//               <React.Fragment key={day.dayId}>
//                 {day.timeSlots.map((slot, slotIndex) => (
//                   <TableRow key={slotIndex}>
//                     <TableCell>{day.name}</TableCell>
//                     <TableCell>
//                       <TextField
//                         type="time"
//                         value={slot.schedule_from}
//                         onChange={(e) => handleTimeChange(day.dayId, slotIndex, 'schedule_from', e.target.value)}
//                         inputProps={{ step: 300 }} // 5 min interval
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <TextField
//                         type="time"
//                         value={slot.schedule_to}
//                         onChange={(e) => handleTimeChange(day.dayId, slotIndex, 'schedule_to', e.target.value)}
//                         inputProps={{ step: 300 }} // 5 min interval
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Switch
//                         checked={slot.enabled}
//                         onChange={() => handleSwitchChange(day.dayId, slotIndex)}
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <IconButton onClick={() => handleDeleteRow(day.dayId, slotIndex)}>
//                         <DeleteIcon />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//                 <TableRow>
//                   <TableCell colSpan={5}>
//                     <IconButton onClick={() => handleAddRow(day.dayId)}>
//                       <AddIcon />
//                     </IconButton>
//                   </TableCell>
//                 </TableRow>
//               </React.Fragment>
//             ))}
//           </TableBody>
//           </Table>
//         </TableContainer>

//         )}</FieldArray>
//   </Box>
//               </Grid>
//             </Grid></Box>
//             }
//             </Box>
//           ) : (
//             ""
//           )}

//           <Box className="flex justify-end gap-4">
//             <>
//               {activeStep > 0 && (
//                 <Button
//                   onClick={() => setActiveStep((prev) => prev - 1)}
//                   variant="outlined"
//                   type="button"
//                 >
//                   {t("back")}
//                 </Button>
//               )}
//               {activeStep == 0 && (
//                 <Button
//                   onClick={() => setActiveStep((prev) => prev + 1)}
//                   variant="outlined"
//                   type="button"
//                 >
//                   {t("next")}
//                 </Button>
//               )}
//               <Button variant="contained" type="submit" disabled={activeStep <= 0} onClick={() => console.log("hello")}>
//                 {t("save")}
//               </Button>
//             </>
//           </Box>
//         </form>
//       </PageContainer>
//     );
//   };

//   export default ManageLocations;
//   function handleTimeChange(dayId: number, slotIndex: number, field: string, newValue: string) {
//     throw new Error("Function not implemented.");
//   }
