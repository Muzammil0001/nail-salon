import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Button,
  Stack,
  Tooltip,
  Fab,
  MenuItem,
  IconButton,
  debounce,
  useTheme,
  Menu,
} from "@mui/material";
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import {
  IconEdit,
  IconTrash,
  IconReload,
  IconX,
  IconPlus,
  IconEye,
  IconThumbUp,
  IconThumbDown,
  IconCalendar,
} from "@tabler/icons-react";
import { Check, Clear as RemoveIcon } from "@mui/icons-material";
import { toast } from "sonner";
import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import { useRouter } from "next/router";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import DeleteConfirmationDialog from "../common/DeleteConfirmationDialog";
import { useSession } from "next-auth/react";
import { AccessRights2 } from "@/types/admin/types";
import dayjs from "dayjs";
import { checkAccess } from "../../../lib/clientExtras";
import { ToastErrorMessage, ToastSuccessMessage } from "../common/ToastMessages";
import { t } from "../../../lib/translationHelper";
import moment from "moment";
import CustomeDatePicker from "../datetime/DateTImePicker";
import { useDispatch, useSelector } from "@/store/Store";
import { setHasNotify } from "@/store/NotifySlice";
import ReservationDetailModal from "./viewDialog";
import UsbPrintButton from "../usbPrinter";
import QRPayPaymentDialog from "./QrPayDialog";
import ReservationCheckTipModal from "./ReservationCheckTipModal";
import AccessDenied from "../NoAccessPage";

type Reservation = {
  name: string;
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  appointment_date: Date;
  reservation_pax: number;
  reservation_status: "PENDING" | "COMELETED" | "INCOMPLETED" | "CENCELED";
  start_time: string;
  last_time: string;
  date: string;
  price_total: number;
  reservation_number: string;
};

const HEADERS = [
  "appointment_number",
  "customer_name",
  "appointment_date",
  "appointment_time",
  "staff_name",
  "total_price",
  "payment_method",
  "payment_status",
  "appointment_status",
  "action",
];
const ReservationManagementListing = () => {
  const dispatch = useDispatch();
  const { data: session }: any = useSession();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openQrCodeDialog, setOpenQrCodeDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [count, setCount] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [viewState, setViewState] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isOpenTipModal, setIsOpenTipModal] = useState(false);

  const [filteredReservations, setFilteredReservations] = useState<
    Reservation[]
  >([]);

  const [isColumnSelection, setIsColumnSelection] = useState<boolean>(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [filters, setFilters] = useState({ from: null, to: null, });
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const hasNotify = useSelector((state) => state.notify.hasNotify);

  useEffect(() => {
    if (paymentSuccess) {
      ToastSuccessMessage("payment_success");

      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "appointment" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      }
    })();
  }, [languageUpdate]);

  const handleDownloadOptionsClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isColumnSelection) {
      setIsColumnSelection(true);
      setDownloadAnchorEl(null);
    } else if (!Boolean(downloadAnchorEl)) {
      setIsColumnSelection(true);
      setDownloadAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setDownloadAnchorEl(null);
  };
  const handleRemoveClick = () => {
    setIsColumnSelection(false);
  };

  const handleColumnSelectionChange = (headCell: string) => {
    setSelectedColumns((prevSelected) => {
      if (prevSelected.includes(headCell)) {
        return prevSelected.filter((col) => col !== headCell);
      } else {
        return [...prevSelected, headCell];
      }
    });
  };

  const handleDownloadClick = async (downloadFormat: string) => {
    try {
      const updatedColumns = HEADERS.filter((col) =>
        selectedColumns.includes(col) && col !== "action"
      );

      const rows = filteredReservations?.map((item: any) => {
        const row: any = {};
        updatedColumns.forEach((col: string) => {
          switch (col) {
            case "appointment_number":
              row[col] = item.reservation_number || "N/A";
              break;
            case "customer_name":
              row[col] = item.customer_name || "N/A";
              break;
            case "appointment_date":
              row[col] = moment(item.date).format("DD/MM/YYYY") || "N/A";
              break;
            case "appointment_time":
              row[col] = `${moment.utc(item.start_time).format("h:mm A")} - ${moment.utc(item.last_time).format("h:mm A")}` || "N/A";
              break;
            case "staff_name":
              row[col] = `${item.staff?.first_name} ${item.staff?.last_name}` || "N/A";
              break;
            case "total_price":
              row[col] = item.price_total?.toFixed(2) ?? "0.00";
              break;
            case "payment_method":
              row[col] = item.payment_method || "N/A";
              break;
            case "payment_status":
              row[col] = item.payment_status || "N/A";
              break;
          }
        });
        return row;
      });

      const tableData = {
        headers: updatedColumns.map((c: string) => t(c, keys)),
        rows: rows?.map((row: any) =>
          updatedColumns.map((col: any) =>
            row[col] !== undefined && row[col] !== null ? row[col] : "N/A"
          )
        ),
      };

      const sheetColumns = updatedColumns.map((col: any) => ({
        header: t(col, keys),
        key: col,
        width: 20,
      }));

      if (updatedColumns.length === 0) {
        ToastErrorMessage(t("at_least_one_field_is_required_to_export_report", keys));
        return;
      }

      const response = await axios.post(
        "/api/downloads/downloaddata",
        {
          columns: updatedColumns.map((c: string) => t(c, keys)),
          tableData,
          rows,
          sheetColumns,
          filename: "appointments_report",
          downloadFormat,
        },
        {
          responseType: "blob",
        }
      );

      const fileExtension = downloadFormat === "excel" ? "xlsx" : "pdf";
      const mimeType =
        downloadFormat === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments_report.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      ToastErrorMessage(error);
      console.error("Download error:", error);
    }

    handleClose();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = async (row: Reservation) => {
    try {
      router.push({
        pathname: "/admin/appointments/manage",
        query: {
          action: "edit",
          id: row.id,
        },
      });
    } catch (error) {
      console.error("Error navigating to edit page:", error);
      toast.error("Failed to navigate to the edit page.");
    }
  };

  const fetchReservations = useCallback(
    async (searchTerm = search) => {
      try {
        const payload = {
          search: searchTerm,
          page,
          dateTime: filters,
          rowsPerPage,
        }
        const response = await axios.post("/api/reservation/allreservation", payload);
        setCount(response.data.count);
        setFilteredReservations(response.data.data);
      } catch (error) {
        console.log ("appointments fetch ~ error:", error)
      }
    },
    [search, page, filters, refresh, rowsPerPage, hasNotify]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(0);
        fetchReservations(value);
      }, 300),
    []
  );
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const response = await axios.post("/api/reservation/paymentstatus", { reservation_id: id, payment_status: "SUCCESS" })
      if (response.status === 200) {
        ToastSuccessMessage(response?.data?.message)
        setRefresh((prev) => !prev)
      }
    } catch (error) {
      ToastErrorMessage(error)
    }
  }
  const handleCompleted = async (row: any) => {
    try {
      const res = await axios.post("/api/reservation/reservationstatus", {
        id: row?.id,
        status: "COMPLETED"
      });
      ToastSuccessMessage(res?.data?.message)
      fetchReservations();
      dispatch(setHasNotify(false));
      setTimeout(() => dispatch(setHasNotify(true)), 0);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  const handleCanceled = async (row: { id: number }) => {
    try {
      const res = await axios.post("/api/reservation/reservationstatus", {
        id: row?.id,
        status: "CANCELED"
      });
      ToastSuccessMessage(res?.data?.message)
      dispatch(setHasNotify(false));
      setTimeout(() => dispatch(setHasNotify(true)), 0);
      fetchReservations();
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [page, rowsPerPage, search, filters, refresh]);

  const handleRefresh = () => {
    setSearch("");
    fetchReservations();
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "Pending",
      COMPLETED: "Completed",
      INCOMPLETED: "Incompleted",
      CANCELED: "Canceled",
      SUCCESS: "Paid",
      REFUNDED: "Refunded",
      DECLINED: "Declined",
    };
    return map[status?.toUpperCase()] || status;
  };

  const getReservationStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return { bg: "#FFF8E1", color: "#FFC700" };
      case "COMPLETED":
        return { bg: "#E6F4EA", color: "#068217" };
      case "INCOMPLETED":
        return { bg: "#FBE9E7", color: "#DA514E" };
      case "CANCELED":
        return { bg: "#FCE8E6", color: "#D32030" };
      default:
        return { bg: "#ECEFF1", color: "#4D5963" };
    }
  };

  const getPaymentStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return { bg: "#E6F4EA", color: "#068217" };
      case "PENDING":
        return { bg: "#FFF8E1", color: "#FFC700" };
      case "DECLINED":
        return { bg: "#FBE9E7", color: "#DA514E" };
      case "REFUNDED":
        return { bg: "#E3F2FD", color: "#0288D1" };
      default:
        return { bg: "#ECEFF1", color: "#4D5963" };
    }
  };

  const getReservationPaymentReceiptData = (reservation: any) => {
    if (!reservation?.details || !Array.isArray(reservation.details)) return [];

    return reservation.details?.map((detail: any) => ({
      service: detail.service_name,
      qty: detail.quantity,
      price: detail.service_price
    }));
  }

  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/appointments")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            session.user.accessrights
              ?.controls as AccessRights2,
            "/admin/appointments",
            "view"
          )))  ? (<PageContainer
            css={{ padding: "0px" }}
            topbar={
              <Box className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
                <Box className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                  <CustomSearch
                    value={search}
                    onChange={handleSearchChange}
                    onClearClick={handleRefresh}
                    onSearchClick={() => debouncedSearch(search)}
                    placeholder={t("search", keys)}
                    className="w-full md:w-auto"
                  />
                  <Box>
                    <CustomeDatePicker
                      allowFutureDate={true}
                      parentFilter="time"
                      onApply={(start, end) =>
                        setFilters({ "from": start, "to": end })
                      }
                    />
                  </Box>
                </Box>
                <Box className=" flex gap-2">
                  {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/appointments")) ||
                    (session?.user?.roles?.includes("BackOfficeUser") &&
                      checkAccess(
                        session.user.accessrights?.controls as AccessRights2,
                        "/admin/appointments",
                        "add"
                      ))) && (
                      <Button
                        onClick={() =>
                          router.push({
                            pathname: "/admin/appointments/manage",
                            query: { action: "create" },
                          })
                        }
                        className="bg-white h-12 w-full md:w-auto text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium me-1"
                        startIcon={<IconPlus className="text-[#2276FF]" />}
                      >
                        {t("add_appointment", keys)}
                      </Button>
                    )}
                  <Box className="relative">
                    <Box
                      onClick={handleDownloadOptionsClick}
                      className="flex items-center cursor-pointer justify-center bg-white size-12 me-2 text-[#2276FF] hover:opacity-90 hover:bg-white hover:text-[#2276FF] relative"
                    >
                      <SaveAltIcon sx={{ color: "#2276FF" }} />
                    </Box>
                    <Menu
                      sx={{ left: -4, top: 2 }}
                      anchorEl={downloadAnchorEl}
                      open={Boolean(downloadAnchorEl)}
                      onClose={handleClose}
                    >
                      <MenuItem onClick={() => handleDownloadClick("pdf")}>
                        {t("download_pdf", keys)}
                      </MenuItem>
                      <MenuItem onClick={() => handleDownloadClick("excel")}>
                        {t("download_excel", keys)}
                      </MenuItem>
                    </Menu>
                    {isColumnSelection && (
                      <IconButton
                        onClick={handleRemoveClick}
                        className="absolute -top-2 -right-2 !z-10 bg-white border-2 border-gray-300 p-1 rounded-full hover:border hover:border-white"
                        size="small"
                      >
                        <RemoveIcon sx={{ color: "red", fontSize: "small" }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Box>
            }
          >
            <Loader loading={loading} />
            <Box className="overflow-x-auto">
              <TableContainer
                sx={{
                  padding: "0px !important",
                }}
              >
                <Table
                  sx={{
                    width: "100%",
                    borderCollapse: "separate",
                    paddingInline: "0px",
                  }}
                  aria-labelledby="tableTitle"
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        backgroundColor: "white",
                      }}
                    >
                      {HEADERS.map((headCell, index) => (
                        <TableCell
                          key={index}
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 7px 0 10px inset !important",
                            textAlign: headCell === "action" ? "center" : "left",
                            padding: "20px",
                            whiteSpace: "nowrap",
                            minWidth: "auto",
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: headCell === "action" ? "center" : "flex-start",
                              gap: "8px",
                              whiteSpace: "nowrap",
                              textAlign: headCell === "action" ? "center" : "left",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                marginRight: "4px",
                                borderRadius: "8px",
                              }}
                            >
                              {isColumnSelection && headCell !== "action" && (
                                <label className="relative cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedColumns.includes(headCell)}
                                    onChange={() =>
                                      handleColumnSelectionChange(headCell)
                                    }
                                    className="peer hidden"
                                  />
                                  <div className="w-6 h-6 border border-blue-500 rounded-lg peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center">
                                    <Check
                                      className={`text-white ${selectedColumns.includes(headCell)
                                        ? "block"
                                        : "hidden"
                                        }`}
                                      fontSize="small"
                                    />
                                  </div>
                                </label>
                              )}
                            </Box>
                            <Typography
                              fontWeight="700"
                              sx={{
                                fontSize: "16px",
                                textTransform: "capitalize",
                              }}
                            >
                              {t(headCell, keys)}
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredReservations.map((row: any) => {
                      const reservationStatusStyles = getReservationStatusStyles(row.status);
                      const paymentStatusStyles = getPaymentStatusStyles(row.payment_status);
                      return (<TableRow key={row.id}>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                            color: "#4D5963",
                          }}
                        >
                          <Typography>{row.reservation_number}</Typography>

                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                            color: "#4D5963",
                          }}
                        >
                          <Typography>{row.customer_name}</Typography>

                        </TableCell>

                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                            color: "#4D5963",
                          }}
                        >
                          <Typography>
                            {`${moment(row?.date).format("DD/MM/YYYY")}`}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                            color: "#4D5963",
                          }}
                        >
                          <Typography>
                            {`${moment.utc(row?.start_time).format("h:mm A")} - ${moment.utc(row?.last_time).format("h:mm A")}`}
                          </Typography>

                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                            color: "#4D5963",
                          }}
                        >
                          <Typography>
                            {`${row.staff?.first_name} ${row.staff?.last_name}`}
                          </Typography>

                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                            color: "#4D5963",
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: "medium",
                            }}
                          >
                            $ {row.price_total?.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                            color: "#4D5963",
                          }}
                        >
                          <Typography>
                            {`${row.payment_method}`}
                          </Typography>

                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                            color: "#4D5963",
                          }}
                        >
                          <Typography
                            sx={{
                              backgroundColor: paymentStatusStyles.bg,
                              color: paymentStatusStyles.color,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: "8px",
                              display: "inline-block",
                              fontWeight: 500,
                            }}
                          >
                            {getStatusLabel(row.payment_status)}
                          </Typography>

                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow: "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "left",
                          }}
                        >
                          <Typography
                            sx={{
                              backgroundColor: reservationStatusStyles.bg,
                              color: reservationStatusStyles.color,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: "8px",
                              display: "inline-block",
                              fontWeight: 500,
                            }}
                          >
                            {getStatusLabel(row.status)}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.03) 10px 0 10px inset !important",
                            textAlign: "center",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="center"
                          >
                            <UsbPrintButton data={getReservationPaymentReceiptData(row) || []} component="icon" />
                            <Tooltip title={t("view", keys)}>
                              <Fab
                                size="small"
                                className="bg-background-paper text-blue-600"
                                onClick={() => { setViewState((prev) => !prev); setSelectedItem(row) }}
                              >
                                <IconEye className="size-[20px]" />
                              </Fab>
                            </Tooltip>
                            {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/appointments")) ||
                              (session?.user?.roles?.includes("BackOfficeUser") &&
                                checkAccess(
                                  session.user.accessrights
                                    ?.controls as AccessRights2,
                                  "/admin/appointments",
                                  "edit"
                                ))) && (
                                <>
                                  {row.status !== "COMPLETED" && row.payment_status !== "SUCCESS" && <>
                                    <Tooltip title={t("edit", keys)}>
                                      <Fab
                                        size="small"
                                        className="bg-background-paper text-blue-600"
                                        onClick={() => handleEdit(row)}
                                      >
                                        <IconEdit className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                  </>}
                                  {row.status !== "COMPLETED" && <>
                                    <Tooltip title={t("approve", keys)}>
                                      <Fab
                                        size="small"
                                        className="bg-background-paper text-green-600"
                                        onClick={() => {
                                          handleCompleted(row);
                                        }}
                                      >
                                        <IconThumbUp className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                    <Tooltip title={t("decline", keys)}>
                                      <Fab
                                        size="small"
                                        className="bg-background-paper text-red-600"
                                        onClick={() => handleCanceled(row)}
                                      >
                                        <IconThumbDown className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                  </>}
                                  {row.payment_status === "PENDING" && row.payment_method.toLowerCase() === "cash" && (
                                    <Tooltip title={t("mark_as_paid", keys)}>
                                      <Fab
                                        size="small"
                                        className="ml-2 bg-background-paper text-green-600"
                                        onClick={() => handleMarkAsPaid(row?.id)}
                                      >
                                        <AttachMoneyIcon className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                  )}
                                  {row.payment_status === "PENDING" && row.payment_method.toLowerCase() === "qr" && (
                                    <Tooltip title={t("mark_as_paid", keys)}>
                                      <Fab
                                        size="small"
                                        className="ml-2 bg-background-paper text-blue-600"
                                        onClick={() => { setOpenQrCodeDialog(true); setSelectedItem(row); }}
                                      >
                                        <QrCodeScannerIcon className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                  )}
                                  {row.status === "COMPLETED" && row.payment_status === "SUCCESS" && row?.check_remaining_amount > 0 && !row?.check_fully_paid && <>
                                    <Tooltip title={t("add_tip", keys)}>
                                      <Fab
                                        size="small"
                                        className="bg-background-paper text-blue-600"
                                        onClick={() => { setIsOpenTipModal((prev) => !prev); setSelectedItem(row) }}
                                      >
                                        <ControlPointIcon className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                  </>}
                                </>
                              )}
                          </Stack>
                        </TableCell>
                      </TableRow>)
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[25, 50, 75, 100, 150, 200, 500]}
                labelRowsPerPage={t("rows_per_page", keys)}
                component="div"
                count={count}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  ".MuiTablePagination-actions": {
                    marginLeft: "auto !important",
                  },
                  ".MuiTablePagination-spacer": {
                    display: "none !important",
                  },
                }}
              />
            </Box>
          </PageContainer>): (<AccessDenied/>)}
      <QRPayPaymentDialog
        open={openQrCodeDialog}
        onClose={() => { setOpenQrCodeDialog(false); fetchReservations(); }}
        reservation={selectedItem}
        setPaymentSuccessCheck={setPaymentSuccess}
      />
      <ReservationDetailModal
        open={viewState}
        onClose={() => setViewState(false)}
        reservation={selectedItem}
        keys={keys}
      />
      <ReservationCheckTipModal
        open={isOpenTipModal}
        onClose={() => { setIsOpenTipModal(false); fetchReservations(); }}
        reservation={selectedItem}
        keys={keys} />
    </>
  );
};


export default ReservationManagementListing;
