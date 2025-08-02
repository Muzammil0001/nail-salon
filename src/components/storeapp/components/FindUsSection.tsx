import React from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import { useSelector } from "@/store/Store";
import moment from "moment";
import { t } from "../../../../lib/translationHelper";

type Props = {
  keys: { text: string; translation: string }[];
};

const weekDaysOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function FindUsSection({ keys }: Props) {
  const selectedLocation = useSelector(
    (state) => state.selectedLocation
  ).selectedLocation;

  const fullAddress = `${selectedLocation?.street}, ${selectedLocation?.city}, ${selectedLocation?.state} ${selectedLocation?.postcode}, ${selectedLocation?.country}`;

  const locationSchedule = selectedLocation?.location_schedule || [];

  const formattedSchedule = weekDaysOrder.map((day) => {

    const daySchedules = locationSchedule
      .filter(
        (s) =>
          s.id?.toLowerCase() === day &&
          Array.isArray(s.timeSlots) &&
          s.timeSlots.length > 0
      )
      .flatMap((s) => s.timeSlots || []);

    if (daySchedules.length === 0) {
      return { day: t(day, keys), timeSlots: [t("closed", keys)] };
    }

    const timeSlots = daySchedules.map((slot) => {
      const fromTime = moment.utc(slot.schedule_from).format("h:mmA");
      const toTime = moment.utc(slot.schedule_to).format("h:mmA");
      return `${fromTime} – ${toTime}`;
    });

    return { day:  t(day, keys), timeSlots };
  });

  const mapsQuery =
    selectedLocation?.latitude && selectedLocation?.longitude
      ? `${selectedLocation.latitude},${selectedLocation.longitude}`
      : encodeURIComponent(fullAddress);

  return (
    <Box sx={{ py: 6, px: { xs: 2, sm: 4, md: 6, backgroundColor: "#f9fafb" } }}>
      <Box sx={{ margin: { lg: "60px", xs: "10px" } }}>
        <Grid container justifyContent="center" alignItems="flex-start" mx="auto">
          {/* Address Info */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#111827",
                mb: 1,
                fontSize: "1.25rem",
              }}
            >
              {t("where_to_find_us", keys)}
            </Typography>

            <Box
              sx={{
                mb: 2,
                color: "#6E082F",
                fontWeight: 500,
                fontSize: { xs: "0.85rem", sm: "0.875rem" },
                lineHeight: 1.6,
              }}
            >
              <Typography component="p" sx={{ wordBreak: "break-word" }}>
                {fullAddress}
              </Typography>
            </Box>

            <a
              href={`https://www.google.com/maps?q=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#111",
                  color: "#fff",
                  textTransform: "none",
                  borderRadius: 100,
                  px: 3,
                  py: 1,
                  fontSize: "0.875rem",
                  mb: 2,
                  "&:hover": {
                    backgroundColor: "#333",
                  },
                }}
              >
                {t("get_directions", keys)}
              </Button>
            </a>

            <Typography
              sx={{
                fontSize: "1rem",
                color: "#4B5563",
                lineHeight: 1.6,
                textAlign: { lg: "left", xs: "justify" },
                mt: 2,
                maxWidth: { xs: "100%", sm: "90%" },
              }}
            >
              {t("juliet_salon_description", keys)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#111827",
                mb: 2,
                fontSize: "1.25rem",
                mt: { md: 0, xs: 3 },
              }}
            >
              {t("weekly_schedule", keys)}
            </Typography>

            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {formattedSchedule.map(({ day, timeSlots }, i) => (
                <Box
                  key={day}
                  component="li"
                  sx={{
                    borderRadius: "0px",
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: i < 6 ? "1px solid #E5E7EB" : "none",
                    py: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      color: "#111827",
                      minWidth: 100,
                      textTransform:"capitalize"
                    }}
                  >
                    {t(day, keys)}
                  </Typography>
                  <Box sx={{ textAlign: "right" }}>
                    {timeSlots.map((slot, idx) => (
                      <Typography
                        key={idx}
                        sx={{
                          fontSize: "0.875rem",
                          color: slot === t("closed", keys) ? "#DC2626" : "#111827",
                          lineHeight: 1.4,
                        }}
                      >
                        {slot}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

