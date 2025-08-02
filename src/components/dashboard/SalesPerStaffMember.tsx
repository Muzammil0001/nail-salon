import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Grid from "@mui/material/Grid2";
import CustomSelect from "@/components/forms/theme-elements/CustomSelect";
import { Box, FormControl, MenuItem, Typography } from "@mui/material";
import { t } from "../../../lib/translationHelper";
import CustomeDatePicker from "@/components/datetime/DateTImePicker";
import axios from "axios";
import { ToastErrorMessage } from "@/components/common/ToastMessages";
import { formatNumberWithUnit } from "../../../lib/formatNumberWithUnit"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
const colors = {
  cash: "#00b788",
  card: "#1890ff",
  other: "#ffa800",
};

export const SalesPerStaff = ({
  session,
  keys,
  data,
  loading,
  setLoading,
}: {
  session: any;
  keys: any;
  data: any;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) => {
  const [salesPerStaffFilters, setSalesPerStaffFilters] = useState({
    paymentMethod: "",
    staff: "",
    startDate: "",
    endDate: "",
  });

  const [pointsData, setPointsData] = useState([]);
  const [salesPerStaff, setSalesPerStaff] = useState({
    series: [],
    options: {
      yaxis: {
        labels: {
          show: false,
        },
      },
      colors: [colors.cash, colors.card, colors.other],
      chart: {
        type: "bar" as const,
        height: 200,
        stacked: true,
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: true,
        },
      },
      legend: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              show: false,
            },
          },
        },
      ],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 2,
          columnWidth: "80%",
          dataLabels: {
            enabled: false,
            total: {
              enabled: false,
            },
          },
        },
      },
      xaxis: {
        type: "category" as const,
        categories: [],
        labels: {
          style: {
            colors: "#333",
            fontSize: "12px",
          },
          show: true,
          rotate: 0,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },

      fill: {
        opacity: 1,
      },
      dataLabels: {
        enabled: false,
      },
    },
    total: 0,
  });

  const [paymentChartData, setPaymentChartData] = useState({
    series: [],
    options: {
      chart: {
        type: "donut" as const,
      },
      labels: ["cash", "card", "other"],
      colors: [colors.cash, colors.card, colors.other],

      stroke: {
        show: true,
        width: 2,
        colors: ["#ffffff"],
        lineCap: "round" as const,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
        position: "bottom" as const,
        markers: {
          size: 6,
          strokeWidth: 0,
          shape: "circle" as const,
        },
        itemMargin: {
          horizontal: 10,
        },
        formatter: function (seriesName: string) {
          return seriesName;
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: {
                offsetY: 0,
                color: "#999",
                fontSize: "13px",
              },
              value: {
                offsetY: 0,
                fontSize: "12px",
                fontWeight: 700,
                formatter: () => "",
              },
              total: {
                show: true,
                showAlways: true,
                label: t("total_value", keys),
                fontSize: "10px",
                color: "#666",
                formatter: function (w: any) {
                  const total = w.globals.seriesTotals.reduce(
                    (a: number, b: number) => a + b,
                    0
                  );
                  return formatNumberWithUnit(total.toString());
                },
              },
            },
          },
          expandOnClick: false,
          borderRadius: 20,
          offset: 15,
        },
      },
    },
  });

  useEffect(() => {
    fetchSlaesPerSraff();
  }, [salesPerStaffFilters]);

  const fetchSlaesPerSraff = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/dashboard/fetchsalesperstaff",
        salesPerStaffFilters
      );
      setSalesPerStaff((prev) => ({
        ...prev,
        series: response.data.barChartData.series,
        options: {
          ...prev.options,
          xaxis: {
            ...prev.options.xaxis,
            categories: response.data.barChartData.options.xaxis.categories,
          },
        },
        total: response.data.barChartData.total,
      }));
      setPaymentChartData((prev) => ({
        ...prev,
        series: response.data.donutChartData.series,
      }));
      setPointsData(response.data.pointsData);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={1}>
      <Grid size={12}>
        <Typography variant="h5">{t("sales_per_staff_member", keys)}</Typography>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <FormControl fullWidth margin="normal">
          <CustomSelect
            name="paymentMethod"
            value={salesPerStaffFilters.paymentMethod}
            onChange={(e: any) => {
              setSalesPerStaffFilters((prev) => ({
                ...prev,
                paymentMethod: e.target.value,
              }));
            }}
            displayEmpty
            sx={{ textTransform: "capitalize" }}
            renderValue={(selected: any) => {
              if (!selected) {
                return (
                  <span style={{ color: "#666666" }}>
                    {t("choose_payment_method", keys)}
                  </span>
                );
              }

              const selectedPaymentMethod = data.paymentMethods.find(
                (paymentMethod: any) => paymentMethod.value === selected
              );

              return selectedPaymentMethod ? (
                t(selectedPaymentMethod.name, keys)
              ) : (
                <span style={{ color: "#666666" }}>
                  {t("choose_payment_method", keys)}
                </span>
              );
            }}
          >
            <MenuItem
              value=""
              sx={{
                minWidth: "50px",
                textAlign: "center",
                color: "gray",
                fontStyle: "italic",
              }}
            >
              {t("choose_payment_method", keys)}
            </MenuItem>
            {data.paymentMethods?.map((paymentMethod: any) => (
              <MenuItem
                key={paymentMethod.value}
                value={paymentMethod.value}
                sx={{ textTransform: "capitalize" }}
              >
                {paymentMethod.name}
              </MenuItem>
            ))}
          </CustomSelect>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <FormControl fullWidth margin="normal">
          <CustomSelect
            name="staff"
            value={salesPerStaffFilters.staff}
            onChange={(e: any) => {
              setSalesPerStaffFilters((prev) => ({
                ...prev,
                staff: e.target.value, 
              }));
            }}
            displayEmpty
            sx={{ textTransform: "capitalize" }}
            renderValue={(selected: any) => {
              if (!selected) {
                return (
                  <span style={{ color: "#666666" }}>
                    {t("choose_staff", keys)}
                  </span>
                );
              }

              const selectedStaff = data.staffs.find(
                (staff: any) => staff.id === selected
              );

              return selectedStaff ? (
                selectedStaff.first_name + " " + selectedStaff.last_name
              ) : (
                <span style={{ color: "#666666" }}>
                  {t("choose_staff_member", keys)}
                </span>
              );
            }}
          >
            <MenuItem
              value=""
              sx={{
                minWidth: "50px",
                textAlign: "center",
                color: "gray",
                fontStyle: "italic",
              }}
            >
              {t("choose_staff_member", keys)}
            </MenuItem>
            {data.staffs?.map((staff: any) => (
              <MenuItem
                key={staff.id}
                value={staff.id}
                sx={{ textTransform: "capitalize" }}
              >
                {staff.first_name + " " + staff.last_name}
              </MenuItem>
            ))}
          </CustomSelect>

        </FormControl>
      </Grid>

      <Grid size={{ xs: 12 }} className="mb-4">
        <CustomeDatePicker
          allowFutureDate={true}
          parentFilter={`time`}
          onApply={(start, end) => {
            setSalesPerStaffFilters((prev) => ({
              ...prev,
              startDate: start,
              endDate: end,
            }));
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, lg: 3 }}>
        <Box className="flex flex-col mt-4">
          {pointsData.map((point: any) => (
            <div className="flex gap-4 items-center">
              <div
                className={`w-6 h-6 rounded-lg`}
                style={{ backgroundColor: point.color }}
              ></div>
              <div className="text-left">
                <Typography variant="subtitle1" fontWeight={900} title={point.value.toString()}>
                  {formatNumberWithUnit(point.value)}
                </Typography>
                <Typography className="text-xs">
                  {t(point.name, keys)}
                </Typography>
              </div>
            </div>
          ))}
        </Box>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <div className="text-center">
          <Typography variant="h5" fontWeight={900} title={salesPerStaff.total.toString()}>
            {t("total", keys)} : ${formatNumberWithUnit(salesPerStaff.total)}
          </Typography>
          <Chart
            options={salesPerStaff.options}
            series={salesPerStaff.series.map((series: any) => ({
              ...series,
              name: t(series.name, keys),
            }))}
            type="bar"
            height={250}
          />
        </div>
      </Grid>
      <Grid size={{ xs: 12, lg: 3 }}>
        <div className="flex justify-center items-center h-full">
          <Chart
            width={"60%"}
            options={{
              ...paymentChartData.options,
              labels: [t("cash", keys), t("card", keys), t("other", keys)],
              plotOptions: {
                ...paymentChartData.options.plotOptions,
                pie: {
                  ...paymentChartData.options.plotOptions.pie,
                  donut: {
                    ...paymentChartData.options.plotOptions.pie.donut,
                    labels: {
                      ...paymentChartData.options.plotOptions.pie.donut.labels,
                      total: {
                        ...paymentChartData.options.plotOptions.pie.donut.labels
                          .total,
                        label: t("total_value", keys),
                      },
                    },
                  },
                },
              },
            }}
            series={paymentChartData.series}
            type="donut"
            height={150}
          />
        </div>
      </Grid>
    </Grid>
  );
};
