import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Grid from "@mui/material/Grid2";
import CustomSelect from "@/components/forms/theme-elements/CustomSelect";
import { Box, FormControl, MenuItem, Typography } from "@mui/material";
import { t } from "../../../lib/translationHelper";
import CustomeDatePicker from "@/components/datetime/DateTImePicker";
import axios from "axios";
import { ToastErrorMessage } from "@/components/common/ToastMessages";
import CustomSelectCheckbox from "../forms/MultiSelect/CustomSelectCheckbox";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { formatNumberWithUnit } from "../../../lib/formatNumberWithUnit";
export const SalesPerServices = ({
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
  const [salesPerServiceFilters, setSalesPerServicesFilters] = useState({
    categories: [],
    services: [],
    startDate: "",
    endDate: "",
    type: "services",
  });
  const [pointsData, setPointsData] = useState([]);
  const [type, setType] = useState("services");
  const [salesPerServices, setSalesPerServices] = useState({
    series: [],
    options: {
      colors: [],
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
      yaxis: {
        labels: {
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
      labels: [],
      colors: [],
      stroke: {
        show: true,
        width: 0,
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
            size: "75%",
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
                color: "#333",
                formatter: () => "",
              },
              total: {
                show: true,
                showAlways: true,
                label: t("total_value", keys),
                fontSize: "10px",
                fontWeight: 600,
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
    fetchSlaesPerServices();
  }, [salesPerServiceFilters]);

  const fetchSlaesPerServices = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/dashboard/fetchsalesperservices",
        salesPerServiceFilters
      );
      setSalesPerServices((prev) => ({
        ...prev,
        series: response.data.barChartData.series,
        options: {
          ...prev.options,
          xaxis: {
            ...prev.options.xaxis,
            categories: response.data.barChartData.options.xaxis.categories,
          },
          colors: response.data.barChartData.colors,
        },
        total: response.data.barChartData.total,
      }));
      setPaymentChartData((prev) => ({
        ...prev,
        series: response.data.donutChartData.series,
        labels: response.data.donutChartData.labels,
        options: {
          ...prev.options,
          colors: response.data.donutChartData.colors,
          labels: response.data.donutChartData.labels,
        },
      }));
      setPointsData(response.data.pointsData);
      if (salesPerServiceFilters.services.length > 0) {
        setType("services");
      } else if (salesPerServiceFilters.categories.length > 0) {
        setType("categories");
      }
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={1}>
      <Grid size={12}>
        <Typography variant="h5">
          {t("sales_per_categories_services", keys)}
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, lg: 6}}>
        <FormControl fullWidth margin="normal">
          <CustomSelectCheckbox
            label={t("choose_categories", keys)}
            options={data.categories.map((category: any) => ({
              label: category.name,
              value: category.id,
            }))}
            value={salesPerServiceFilters.categories as any}
            onChange={(selectedCategories: any[]) =>
              setSalesPerServicesFilters((prev:any) => {
                const filteredServices = data.services
                  ?.filter((service: any) => selectedCategories.includes(service.category_id))
                  ?.map((service: any) => service.id);

                return {
                  ...prev,
                  categories: selectedCategories,
                  services: prev.services.filter((id: number) =>
                    filteredServices.includes(id)
                  ),
                };
              })
            }
          />
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, lg: 6}}>
        <FormControl fullWidth margin="normal">
          <CustomSelectCheckbox
            label={t("choose_services", keys)}
            options={data.services
              ?.filter((service: any) =>
                (salesPerServiceFilters.categories as string[]).includes(service?.category_id)
              )
              ?.map((service: any) => ({
                label: service.name,
                value: service.id,
              }))}
            value={salesPerServiceFilters.services as any}
            onChange={(value: any[]) =>
              setSalesPerServicesFilters((prev:any) => ({
                ...prev,
                services: value,
              }))
            }
          />
        </FormControl>
      </Grid>


      <Grid size={{ xs: 12 }} className="my-4">
        <CustomeDatePicker
          allowFutureDate={true}
          parentFilter={`time`}
          onApply={(start, end) => {
            setSalesPerServicesFilters((prev) => ({
              ...prev,
              startDate: start,
              endDate: end,
            }));
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, lg: 3 }}>
        <Typography variant="h6">
          {t("sales_report_per", keys)} {t(type, keys)}
        </Typography>
        <Box className="flex flex-col mt-4">
          {pointsData.map((point: any, idx:number) => (
            <div key={idx} className="flex gap-4 items-center">
              <div
                className={`w-6 h-6 rounded-lg`}
                style={{ backgroundColor: point.color }}
              ></div>
              <div className="text-left">
                <Typography variant="subtitle1" title={point.value.toString()} fontWeight={900}>
                  {formatNumberWithUnit(point.value)}
                </Typography>
                <Typography className="text-xs">{point.name}</Typography>
              </div>
            </div>
          ))}
        </Box>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <div className="text-center">
          <Typography variant="h5" fontWeight={900} title={salesPerServices.total.toString()}>
            {t("total", keys)} : ${formatNumberWithUnit(salesPerServices.total)}
          </Typography>
          <Chart
            options={salesPerServices.options}
            series={salesPerServices.series}
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
      <Grid size={{ xs: 12, lg: 4 }}>
        <></>
      </Grid>
    </Grid>
  );
};
