import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  LinearProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { t } from "../../../lib/translationHelper";
import axios from "axios";
import Loader from "../loader/Loader";
import { ToastErrorMessage } from "../common/ToastMessages";

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime: string;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        avgtemp_c: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        avghumidity: number;
        condition: {
          text: string;
          icon: string;
        };
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
      };
    }>;
  };
}

interface DateViewModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
  address: string;
  keys: any;
  session: any;
}

const DateViewModal: React.FC<DateViewModalProps> = ({
  open,
  onClose,
  data,
  address,
  keys,
  session,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!address || !data.date) return;
        setLoading(true);
        const response = await axios.get(
          "https://api.weatherapi.com/v1/history.json",
          {
            params: {
              key: process.env.NEXT_PUBLIC_WEATHER_API_KEY,
              q: address,
              dt: data.date,
            },
          }
        );
        setWeatherData(response.data);
      } catch (error) {
        ToastErrorMessage(t("failed_to_load_weather_data", keys));
      } finally {
        setLoading(false);
      }
    })();
  }, [data]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(5px)",
        },
      }}
    >
      {weatherData && (
        <DialogTitle>
          <Typography variant="h5" component="div">
            {weatherData.location.name}, {weatherData.location.country}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {new Date(
              weatherData.forecast.forecastday[0].date
            ).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </DialogTitle>
      )}
      <DialogContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t("total", keys)}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        {session.user.currency_symbol}
                        {data.totalSales} {t("sales", keys)}
                      </Typography>
                      <LinearProgress
                        color="success"
                        variant="determinate"
                        value={
                          (data.totalSales /
                            (data.totalSales +
                              data.cashTips +
                              data.cardTips +
                              data.otherTips)) *
                          100
                        }
                        sx={{
                          flex: 1,
                          height: 10,
                          borderRadius: 5,
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        {session.user.currency_symbol}
                        {data.cashTips + data.cardTips + data.otherTips}{" "}
                        {t("tips", keys)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t("cash", keys)}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        {session.user.currency_symbol}
                        {data.cashSales} {t("sales", keys)}
                      </Typography>
                      <LinearProgress
                        color="error"
                        variant="determinate"
                        value={
                          (data.cashSales / (data.cashSales + data.cashTips)) *
                          100
                        }
                        sx={{ flex: 1, height: 10, borderRadius: 5 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        {session.user.currency_symbol}
                        {data.cashTips} {t("tips", keys)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t("card", keys)}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        {session.user.currency_symbol}
                        {data.cardSales} {t("sales", keys)}
                      </Typography>
                      <LinearProgress
                        color="error"
                        variant="determinate"
                        value={
                          (data.cardSales / (data.cardSales + data.cardTips)) *
                          100
                        }
                        sx={{ flex: 1, height: 10, borderRadius: 5 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        {session.user.currency_symbol}
                        {data.cardTips} {t("tips", keys)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t("other", keys)}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        {session.user.currency_symbol}
                        {data.otherSales} {t("sales", keys)}
                      </Typography>
                      <LinearProgress
                        color="error"
                        variant="determinate"
                        value={
                          (data.otherSales /
                            (data.otherSales + data.otherTips)) *
                          100
                        }
                        sx={{ flex: 1, height: 10, borderRadius: 5 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        {session.user.currency_symbol}
                        {data.otherTips} {t("tips", keys)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {weatherData && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <img
                        src={
                          weatherData.forecast.forecastday[0].day.condition.icon
                        }
                        alt={
                          weatherData.forecast.forecastday[0].day.condition.text
                        }
                        style={{ marginRight: 16 }}
                      />
                      <Typography variant="h4" component="div">
                        {weatherData.forecast.forecastday[0].day.condition.text}
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, md: 6 }}>
                        <Typography variant="h3" component="div">
                          {weatherData.forecast.forecastday[0].day.avgtemp_c}°C
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t("average_temperature", keys)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 6 }}>
                        <Typography variant="h6" component="div">
                          {t("high", keys)}:{" "}
                          {weatherData.forecast.forecastday[0].day.maxtemp_c}°C
                        </Typography>
                        <Typography variant="h6" component="div">
                          {t("low", keys)}:{" "}
                          {weatherData.forecast.forecastday[0].day.mintemp_c}°C
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t("weather_details", keys)}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("wind_speed", keys)}
                        </Typography>
                        <Typography variant="body1">
                          {weatherData.forecast.forecastday[0].day.maxwind_kph}{" "}
                          km/h
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("humidity", keys)}
                        </Typography>
                        <Typography variant="body1">
                          {weatherData.forecast.forecastday[0].day.avghumidity}%
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("precipitation", keys)}
                        </Typography>
                        <Typography variant="body1">
                          {
                            weatherData.forecast.forecastday[0].day
                              .totalprecip_mm
                          }{" "}
                          mm
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("uv_index", keys)}
                        </Typography>
                        <Typography variant="body1">
                          {weatherData.forecast.forecastday[0].day.uv}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("sunrise", keys)}
                        </Typography>
                        <Typography variant="body1">
                          {weatherData.forecast.forecastday[0].astro.sunrise}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t("sunset", keys)}
                        </Typography>
                        <Typography variant="body1">
                          {weatherData.forecast.forecastday[0].astro.sunset}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ width: "172px", height: "56px", fontSize: "16px" }}
        >
          {t("close", keys)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateViewModal;
