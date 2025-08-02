import { Box, Grid, Select, Stack } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import moment from "moment";
import { useEffect, useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { IconCalendar } from "@tabler/icons-react";
import axios from "axios";
import { ToastErrorMessage } from "../common/ToastMessages";
import { t } from "../../../lib/translationHelper";
import { useSelector } from "@/store/Store";

CustomeDatePicker.propTypes = {
  onApply: PropTypes.func.isRequired,
  parentFilter: PropTypes.string.isRequired,
  allowFutureDate: PropTypes.bool,
};

CustomeDatePicker.defaultProps = {
  allowFutureDate: false,
};

export default function CustomeDatePicker({
  onApply,
  parentFilter,
  allowFutureDate,
}: {
  onApply: any;
  parentFilter: any;
  allowFutureDate?: boolean;
}) {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [startDateHH, setStartDateHH] = useState("");
  const [endDateHH, setEndDateHH] = useState("");
  const [startDateMM, setStartDateMM] = useState("");
  const [endDateMM, setEndDateMM] = useState("");
  const [HrPeriod, setHrPeriod] = useState("AM");
  const [endHrPeriod, setEndHrPeriod] = useState("AM");
  const [hrFormate, setHrFormate] = useState("24");
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });
  const [timeError, setTimeError] = useState("");

  useEffect(() => {
    setStartDateHH("");
    setEndDateHH("");
    setStartDateMM("");
    setEndDateMM("");
    setHrPeriod("AM");
    setEndHrPeriod("AM");
  }, [hrFormate]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  useEffect(() => {
    if (parentFilter === "") {
      // handleClose();
      handleClear();
    }
  }, [parentFilter]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClear = () => {
    setTimeError("");
    setOpen(false);
    setSelectedDate("");
    setSelectedDateRange({
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    });
    setStartDateHH("");
    setStartDateMM("");
    setEndDateHH("");
    setEndDateMM("");
    setHrPeriod("AM");
    setEndHrPeriod("AM");
    setHrFormate("24");
    onApply("", "");
  };

  const handleApply = () => {
    let startDate = {};
    let endDate = "";

    if (hrFormate === "24") {
      // selected start date and end date
      let givenStartDate = moment(
        selectedDateRange.startDate,
        "ddd MMM DD YYYY HH:mm:ss ZZ"
      );
      let givenEndDate = moment(
        selectedDateRange.endDate,
        "ddd MMM DD YYYY HH:mm:ss ZZ"
      );
      // time covert 24hr  and add date string
      let manualStartTime = `${startDateHH}:${startDateMM}`;
      let manualEndTime = `${endDateHH}:${endDateMM}`;
      let [sHours, sMinutes] = manualStartTime.split(":");
      let [hours, minutes] = manualEndTime.split(":");
      givenStartDate.set({
        hour: parseInt(sHours),
        minute: parseInt(sMinutes),
      });
      givenEndDate.set({ hour: parseInt(hours), minute: parseInt(minutes) });
      //final send selected deta
      startDate = givenStartDate.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
      endDate = givenEndDate.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
      // setSelectedDate(`${startDate} - ${endDate}`);
      setSelectedDate(
        `${givenStartDate.format("DD.MM.YYYY HH:mm")} - ${givenEndDate.format(
          "DD.MM.YYYY HH:mm"
        )}`
      );
    } else if (hrFormate === "12") {
      let givenStartDate = moment(
        selectedDateRange.startDate,
        "ddd MMM DD YYYY HH:mm:ss ZZ"
      );
      let givenEndDate = moment(
        selectedDateRange.endDate,
        "ddd MMM DD YYYY HH:mm:ss ZZ"
      );

      const startTime12 = `${startDateHH}:${startDateMM} ${HrPeriod}`;
      const endTime12 = `${endDateHH}:${endDateMM} ${endHrPeriod}`;
      setSelectedDate(
        `${givenStartDate.format(
          "DD.MM.YYYY"
        )} ${startTime12} - ${givenEndDate.format("DD.MM.YYYY")} ${endTime12}`
      );

      const startTime24 = moment(startTime12, "hh:mm A").format("HH:mm");
      const endTime24 = moment(endTime12, "hh:mm A").format("HH:mm");

      let manualStartTime = startTime24;
      let manualEndTime = endTime24;
      let [sHours, sMinutes] = manualStartTime.split(":");
      let [hours, minutes] = manualEndTime.split(":");
      givenStartDate.set({
        hour: parseInt(sHours),
        minute: parseInt(sMinutes),
      });
      givenEndDate.set({ hour: parseInt(hours), minute: parseInt(minutes) });
      startDate = givenStartDate.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
      endDate = givenEndDate.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
    }

    const sDate = moment(startDate, "ddd MMM DD YYYY hh:mm:ss GMT+0530");
    const eDate = moment(endDate, "ddd MMM DD YYYY hh:mm:ss GMT+0530");

    if (sDate >= eDate) {
      setTimeError(t("from_time_must_not_be_greater_then_to_time", keys));
    } else {
      setTimeError("");
      onApply(startDate, endDate);
      setOpen(false);
    }
  };

  const hour: string[] = [];
  for (let i = 1; i <= 12; i++) {
    hour.push(i.toString().padStart(2, "0"));
  }

  const hour24: string[] = [];
  for (let i = 0; i <= 23; i++) {
    hour24.push(i.toString().padStart(2, "0"));
  }

  const minits: string[] = [];
  for (let i = 0; i <= 59; i++) {
    minits.push(i.toString().padStart(2, "0"));
  }

  const handlerStartDateHH = (event: any) => {
    setStartDateHH(event.target.value);
  };
  const handlerStartDateMM = (event: any) => {
    setStartDateMM(event.target.value);
  };
  const handlerEndDateHH = (event: any) => {
    setEndDateHH(event.target.value);
  };
  const handlerEndDateMM = (event: any) => {
    setEndDateMM(event.target.value);
  };
  const handlerChangeAmPm = (event: any) => {
    setHrPeriod(event.target.value);
  };
  const handlerEndChangeAmPm = (event: any) => {
    setEndHrPeriod(event.target.value);
  };
  const handlerFormateChange = (event: any) => {
    setHrFormate(event.target.value);
  };

  const handleSelect = (ranges: any) => {
    setSelectedDateRange(ranges.selection);
    const startDate = moment(
      ranges.selection.startDate,
      "ddd MMM DD YYYY hh:mm:ss GMT+0530"
    ).format("DD.MM.YYYY HH:MM");
    const endDate = moment(
      ranges.selection.endDate,
      "ddd MMM DD YYYY hh:mm:ss GMT+0530"
    ).format("DD.MM.YYYY HH:MM");
    // setSelectedDate(`${startDate} - ${endDate}`);
    // console.log(`${startDate} - ${endDate}`);
  };
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "date_range_picker" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      }
    })();
  }, [languageUpdate]);
  return (
    <>
      <Button
        variant="outlined"
        onClick={handleClickOpen}
        className="text-nowrap h-11 me-2 bg-background-paper hover:bg-background-paper rounded-3xl py-2 text-text-primary hover:text-text-primary"
        style={{ justifyContent: "flex-start" }}
      >
        {selectedDate !== ""
          ? `${selectedDate}`
          : "dd.mm.yyyy hh:mm - dd.mm.yyyy hh:mm"}
        <IconCalendar size={20} className="mx-1 text-primary-main" />
      </Button>
      <Dialog
        sx={{
          "& .MuiDialog-container": {
            "& .MuiPaper-root": {
              width: "100%",
              maxWidth: "709px", // Set your width here
            },
          },
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(5px)",
          },
        }}
        open={open}
        // onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Grid container item xs={12} style={{ height: "390px" }}>
              <Grid item xs={12} sm={6}>
                <p style={{ margin: "0 0 14px 0", fontWeight: "bold" }}>
                  {t("date_range", keys)}
                </p>
                <Stack>
                  {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
										<DateRangeCalendar calendars={1} />
									</LocalizationProvider> */}
                  <DateRange
                    onChange={handleSelect}
                    moveRangeOnFirstSelection={false}
                    months={1}
                    ranges={[selectedDateRange]}
                    direction="horizontal"
                    maxDate={
                      allowFutureDate ? new Date(2999, 12, 12) : new Date()
                    }
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} style={{ padding: "30px 3px 0" }}>
                <Box
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "70px",
                  }}
                >
                  <span>
                    {hrFormate === "12" ? (
                      <div>
                        <div>
                          <p
                            style={{
                              margin: "0",
                              paddingLeft: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            {t("from", keys)}
                          </p>
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            {/* <InputLabel id="demo-select-small-label">HH</InputLabel> */}
                            <Select
                              value={startDateHH}
                              onChange={handlerStartDateHH}
                              displayEmpty
                              inputProps={{ "aria-label": "Without label" }}
                              renderValue={(value) => {
                                if (value === "") {
                                  return <span>HH</span>; // Placeholder text
                                }
                                return value;
                              }}
                            >
                              {hour.map((i) => (
                                <MenuItem key={i} value={i}>
                                  {i}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            {/* <InputLabel id="demo-select-small-label">MM</InputLabel> */}
                            <Select
                              displayEmpty
                              inputProps={{ "aria-label": "Without label" }}
                              value={startDateMM}
                              onChange={handlerStartDateMM}
                              renderValue={(value) => {
                                if (value === "") {
                                  return <span>MM</span>; // Placeholder text
                                }
                                return value;
                              }}
                            >
                              {/*
														<MenuItem value="">
														<em>None</em>
														</MenuItem>
													*/}
                              {minits.map((i) => (
                                <MenuItem key={i} value={i}>
                                  {i}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>{" "}
                          
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            {/* <InputLabel id="demo-select-small-label">AM/PM</InputLabel> */}
                            <Select
                              displayEmpty
                              inputProps={{ "aria-label": "Without label" }}
                              value={HrPeriod}
                              onChange={handlerChangeAmPm}
                              renderValue={(value) => {
                                if (value === "") {
                                  return <span>aa</span>; // Placeholder text
                                }
                                return value;
                              }}
                            >
                              {/* <MenuItem value="" disabled>
																<em>MM</em>
															</MenuItem> */}
                              <MenuItem value={"AM"}>AM</MenuItem>
                              <MenuItem value={"PM"}>PM</MenuItem>
                            </Select>
                          </FormControl>
                        </div>
                        <div>
                          <p
                            style={{
                              margin: "0",
                              paddingLeft: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            {t("to", keys)}
                          </p>
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            {/* <InputLabel id="demo-select-small-label">HH</InputLabel> */}
                            <Select
                              displayEmpty
                              inputProps={{ "aria-label": "Without label" }}
                              value={endDateHH}
                              onChange={handlerEndDateHH}
                              renderValue={(value) => {
                                if (value === "") {
                                  return <span>HH</span>; // Placeholder text
                                }
                                return value;
                              }}
                            >
                              {hour.map((i) => (
                                <MenuItem key={i} value={i}>
                                  {i}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            {/* <InputLabel id="demo-select-small-label">MM</InputLabel> */}
                            <Select
                              displayEmpty
                              inputProps={{ "aria-label": "Without label" }}
                              value={endDateMM}
                              onChange={handlerEndDateMM}
                            >
                              {minits.map((i) => (
                                <MenuItem key={i} value={i}>
                                  {i}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>{" "}
                          
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            {/* <InputLabel id="demo-select-small-label">AM/PM</InputLabel> */}
                            <Select
                              displayEmpty
                              inputProps={{ "aria-label": "Without label" }}
                              value={endHrPeriod}
                              onChange={handlerEndChangeAmPm}
                            >
                              <MenuItem value={"AM"}>AM</MenuItem>
                              <MenuItem value={"PM"}>PM</MenuItem>
                            </Select>
                          </FormControl>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>
                          <p
                            style={{
                              margin: "0",
                              paddingLeft: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            {t("from", keys)}
                          </p>
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            <InputLabel id="demo-select-small-label">
                              HH
                            </InputLabel>
                            <Select
                              labelId="demo-select-small-label"
                              id="demo-select-small"
                              value={startDateHH}
                              label="startDateHH"
                              onChange={handlerStartDateHH}
                              renderValue={(value) => {
                                if (value === "") {
                                  return <span>HH</span>; // Placeholder text
                                }
                                return value;
                              }}
                            >
                              {hour24.map((i) => (
                                <MenuItem key={i} value={i}>
                                  {i}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            <InputLabel id="demo-select-small-label">
                              MM
                            </InputLabel>
                            <Select
                              labelId="demo-select-small-label"
                              id="demo-select-small"
                              value={startDateMM}
                              label="startDateMM"
                              onChange={handlerStartDateMM}
                              renderValue={(value) => {
                                if (value === "") {
                                  return <span>MM</span>; // Placeholder text
                                }
                                return value;
                              }}
                            >
                              {minits.map((i) => (
                                <MenuItem key={i} value={i}>
                                  {i}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>{" "}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: "0",
                              paddingLeft: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            {t("to", keys)}
                          </p>
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            <InputLabel id="demo-select-small-label">
                              HH
                            </InputLabel>
                            <Select
                              labelId="demo-select-small-label"
                              id="demo-select-small"
                              value={endDateHH}
                              label="endDateHH"
                              onChange={handlerEndDateHH}
                              renderValue={(value) => {
                                if (value === "") {
                                  return <span>HH</span>; // Placeholder text
                                }
                                return value;
                              }}
                            >
                              {hour24.map((i) => (
                                <MenuItem key={i} value={i}>
                                  {i}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <FormControl sx={{ m: 1, minWidth: 70 }} size="small">
                            <InputLabel id="demo-select-small-label">
                              MM
                            </InputLabel>
                            <Select
                              labelId="demo-select-small-label"
                              id="demo-select-small"
                              value={endDateMM}
                              label="endDateMM"
                              onChange={handlerEndDateMM}
                              renderValue={(value) => {
                                if (value === "") {
                                  return <span>MM</span>; // Placeholder text
                                }
                                return value;
                              }}
                            >
                              {minits.map((i) => (
                                <MenuItem key={i} value={i}>
                                  {i}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>{" "}
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <p style={{ margin: "10px 0 14px 10px" }}>
                        {t("select_format", keys)}:{" "}
                      </p>
                      <FormControl sx={{ m: 1, minWidth: 100 }} size="small">
                        {/* <InputLabel id="demo-select-small-label">select</InputLabel> */}
                        <Select
                          displayEmpty
                          inputProps={{ "aria-label": "Without label" }}
                          value={hrFormate}
                          onChange={handlerFormateChange}
                        >
                          <MenuItem value={"24"}>24 hr</MenuItem>
                          <MenuItem value={"12"}>12 hr</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                    {timeError !== "" ? (
                      <span style={{ color: "red" }}>{timeError}</span>
                    ) : (
                      ""
                    )}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginLeft: "10px",
                      marginBottom:"10px"
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      sx={{
                        fontWeight: "bold",
                        width: "100%",
                        height: "45px",
                      }}
                      onClick={handleClear}
                      className="clearButton"
                    >
                      {t("clear", keys)}
                    </Button>
                    <Button
                      sx={{
                        fontWeight: "bold",
                        width: "100%",
                        height: "45px",
                      }}
                      variant="contained"
                      onClick={handleApply}
                    >
                      {t("apply", keys)}
                    </Button>
                  </div>
                </Box>
              </Grid>
            </Grid>
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
}
