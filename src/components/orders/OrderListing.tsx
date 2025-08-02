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
  Stack,
  Tooltip,
  Fab,
  Grid,
  IconButton,
  MenuItem,
  Checkbox, Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  Menu,
} from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { AccessRights2, AlertInterface } from "@/types/admin/types";
import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import { useRouter } from "next/router";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import { debounce, max } from "lodash";
import { Check, Clear as RemoveIcon } from "@mui/icons-material";
import CustomeDatePicker from "../datetime/DateTImePicker";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DeleteConfirmationDialog from "../common/DeleteConfirmationDialog";
import { getCurrencySymbol } from "../../../lib/getClientEnv";
import { checkAccess } from "../../../lib/clientExtras";
import { ToastErrorMessage, ToastSuccessMessage } from "../common/ToastMessages";
import { useDispatch, useSelector } from "@/store/Store";
import { setHasNotify } from "@/store/NotifySlice";
import QRScanPaymentDialog from "./QrPayDialog";
import EditIcon from '@mui/icons-material/Edit';
import { printViaUSB } from "../../../lib/printViaUSB";

interface Order {
  id: string;
  order_number: number;
  tip: number;
  total_price: number;
  extra_charges?: { name: string; amount: number }[];
  order_details: {
    item_name: string;
    item_price: number;
    quantity: number;
  }[];
}

import {
  IconTrash,
  IconReload,
  IconX,
  IconEye,
  IconThumbUp,
  IconThumbDown,
} from "@tabler/icons-react";

import { t } from "../../../lib/translationHelper";
import moment from "moment";
import AssignStaffDialog from "./AssignStaffDialog";
import { textTransform } from "@mui/system";
import AccessDenied from "../NoAccessPage";
const HEADERS = [
  "order_number",
  "ordered_by",
  "name",
  "total",
  "order_status",
  "payment_status",
  "payment_method",
  "created_at",
  "staff",
  "action",
];

const OrderListing = ({ session }: any) => {
  const router = useRouter();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [openQrCodeDialog, setOpenQrCodeDialog] = useState(false);
  const [count, setCount] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const hasNotify = useSelector((state) => state.notify.hasNotify);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [clearDateTimeFilter, setClearDateTimeFilter] = useState(false);
  const [openAssignStaffDialog, setOpenAssignStaffDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

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
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "orders" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);
  const [datetimeFilter, setDatetimeFilters] = useState<Record<string, any>>({
    from: null,
    to: null,
  });
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(0);
        setSearch(value);
      }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
  };

  const [isColumnSelection, setIsColumnSelection] = useState<boolean>(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const dispatch = useDispatch();
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/orders/fetchallorders", {
        rowsPerPage,
        page,
        search,
        datetimeFilter,
      });
      setOrders(response.data.orders);

      setCount(response.data.count);
    } catch (error) {
      console.error("~ fetchOrders ~ error:", error)
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, [refresh, rowsPerPage, page, search, datetimeFilter, hasNotify]);

  const deleteOrder = async () => {
    try {
      await axios.post("/api/orders/deleteorder", { id: openDeleteDialog.id });
      dispatch(setHasNotify(false));
      setTimeout(() => dispatch(setHasNotify(true)), 0);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setOpenDeleteDialog(null);
    }
  };
  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
    textTransform: "capitalize"
  };

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
      const updatedColumns = HEADERS.filter(
        (col: string) => selectedColumns.includes(col) && col !== "action"
      );

      const rows = orders?.map((item: any) => {
        const row: any = {};

        updatedColumns.forEach((col: string) => {
          switch (col) {

            case "order_number":
              row[col] = item.order_number ?? "N/A";
              break;
            case "ordered_by":
              row[col] = item.is_customer ? "Customer" : "Admin";
              break;
            case "name":
              row[col] = item.is_customer ? `${item?.customers?.firstname} ${item?.customers?.lastname}` : `${item?.user?.first_name} ${item?.user?.last_name}`;
              break;
            case "total":
              row[col] = item.total_price?.toFixed(2) ?? "0.00";
              break;
            case "order_status":
              row[col] = getStatusLabel(item.order_status) || "N/A";
              break;
            case "payment_status":
              row[col] =
                item.order_transaction?.payment_status
                  ? getStatusLabel(item.order_transaction?.payment_status)
                  : "N/A";
              break;
            case "payment_method":
              row[col] =
                item?.payment_method
                  ? item?.payment_method
                  : "Unknown";
              break;
            case "created_at":
              row[col] = moment(item.created_at).format("DD/MM/YYYY");
              break;
            case "staff":
              row[col] = item?.staff ? `${item?.staff?.first_name} ${item?.staff?.last_name}` : "N/A";
              break;
            default:
              row[col] = "N/A";
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
        ToastErrorMessage(
          t("at_least_one_field_is_required_to_export_report", keys)
        );
        return;
      }

      const response = await axios.post(
        "/api/downloads/downloaddata",
        {
          columns: updatedColumns.map((c: string) => t(c, keys)),
          tableData,
          rows,
          sheetColumns,
          filename: "orders_report",
          downloadFormat,
        },
        { responseType: "blob" }
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
      a.download = `orders_report.${fileExtension}`;
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


  const handleRemoveClick = () => {
    setIsColumnSelection(false);
    setDownloadTriggered(false);
  };


  const handleEditStaff = (row: any) => {
    setSelectedItem(row);
    setOpenAssignStaffDialog(true);
    setSelectedStaffId(row.staff_id);
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "Pending",
      COMPLETED: "Completed",
      INCOMPLETED: "Incompleted",
      CANCELLED: "Cancelled",
      CONFIRMED: "Confirmed",
      SUCCESS: "Paid",
      REFUNDED: "Refunded",
      DECLINED: "Declined",
    };
    return map[status?.toUpperCase()] || status;
  };

  const getOrderStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return { bg: "#FFF8E1", color: "#FFC700" };
      case "COMPLETED":
        return { bg: "#E6F4EA", color: "#068217" };
      case "INCOMPLETED":
        return { bg: "#FBE9E7", color: "#DA514E" };
      case "CANCELLED":
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

  const handleUpdateOrderStatus = async (orderId: any, status: string) => {
    try {
      const res = await axios.post("/api/orders/orderstatus", {
        order_id: orderId,
        order_status: status
      });
      ToastSuccessMessage(res?.data?.message)
      fetchOrders();
      dispatch(setHasNotify(false));
      setTimeout(() => dispatch(setHasNotify(true)), 0);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };


  const handleMarkAsPaid = async (id: string) => {
    try {
      const response = await axios.post("/api/orders/payorderpayment", { order_id: id, payment_status: "SUCCESS" })
      if (response.status === 200) {
        ToastSuccessMessage(response?.data?.message)
        setRefresh((prev) => !prev)
        dispatch(setHasNotify(false));
        setTimeout(() => dispatch(setHasNotify(true)), 0);
      }
    } catch (error) {
      ToastErrorMessage(error)
    }
  }


  const transformOrderToReceiptData = (order: any) => {
    const services = order.order_details.map((item: any) => ({
      service_name: item.item_name,
      price: item.item_price,
      quantity: item.quantity,
    }));

    const extra_charges =
      order.extra_charges?.map((charge: { name: string; amount: number }) => ({
        name: charge.name,
        amount: charge.amount,
      })) || [];

    const staff_name = order.staff
      ? `${order.staff.first_name ?? ''} ${order.staff.last_name ?? ''}`.trim()
      : '';

    return {
      order_number: order.order_number,
      services,
      extra_charges: extra_charges.length ? extra_charges : undefined,
      tip: order.tip || 0,
      total: order.total_price,
      header: '*** JT NAIL SALON ***',
      footer: 'Thank you! See you soon!',
      date: moment(order.created_at).format('DD/MM/YYYY'),
      staff_name,
    };
  };

  const handlePrint = async (order: any) => {
    try {
      await printViaUSB({
        data: transformOrderToReceiptData(order),
        printType: "order_receipt",
      });
      ToastSuccessMessage("printing_success");
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/orders")) ||
        ((session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            session.user.accessrights
              ?.controls as AccessRights2,
            "/admin/orders",
            "view"
          )))) ? (<PageContainer
            css={{ padding: "0px" }}
            topbar={
              <Box className="w-full flex justify-between items-center">
                <Box className="flex gap-3 items-center ">
                  <CustomSearch
                    className="w-full"
                    value={search}
                    onChange={handleSearchChange}
                    onSearchClick={() => debouncedSearch(search)}
                    placeholder={t("search", keys)}
                    onClearClick={() => {
                      if (search) {
                        setSearch("");
                      }
                    }}
                  />

                  <Box>
                    <CustomeDatePicker
                      allowFutureDate={true}
                      parentFilter={`${clearDateTimeFilter ? "" : "time"}`}
                      onApply={(start, end) =>
                        setDatetimeFilters({ from: start, to: end })
                      }
                    />
                  </Box>
                  <IconButton
                    onClick={() => {
                      setClearDateTimeFilter((prev) => !prev);
                    }}
                    className="bg-white ml-[-10px] text-primary-main size-11 hover:opacity-90 hover:bg-white"
                  >
                    <IconReload size={20} />
                  </IconButton>
                </Box>
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
            }
          >
            <Loader loading={loading} />
            <Box>
              <TableContainer sx={{ padding: "0px !important" }}>
                <Table sx={{ width: "100%", borderCollapse: "separate" }} aria-labelledby="tableTitle">
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
                    {orders?.map((row: any, index: number) => {
                      const paymentStatus = row?.payment_status;
                      const statusStyles = getOrderStatusStyles(row.order_status);
                      const paymentStyles = getPaymentStatusStyles(paymentStatus);

                      return (
                        <TableRow key={index}>
                          <TableCell sx={{ ...tableCellCommonStyling }}>{row.order_number}</TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling }}>{row?.order_by}</TableCell>
                          <TableCell sx={{ ...tableCellCommonStyling }}>{row.is_customer ? `${row?.customers?.firstname} ${row?.customers?.lastname}` : `${row?.user?.first_name} ${row?.user?.last_name}`}</TableCell>
                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            {row.total_price} {getCurrencySymbol(row?.order_transaction?.transaction_detail?.currency || "usd")}
                          </TableCell>
                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            <Box
                              sx={{
                                backgroundColor: statusStyles.bg,
                                color: statusStyles.color,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: "10px",
                                display: "inline-block",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              {getStatusLabel(row.order_status)}
                            </Box>
                          </TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            <Box
                              sx={{
                                backgroundColor: paymentStyles.bg,
                                color: paymentStyles.color,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: "10px",
                                display: "inline-block",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              {getStatusLabel(paymentStatus)}
                            </Box>
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
                          <TableCell sx={{ ...tableCellCommonStyling }}>{moment(row.created_at).format("DD/MM/YYYY")}</TableCell>
                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            {row?.staff ? (
                              <Box display="flex" alignItems="center" justifyContent="center" gap={1.5}>
                                <Typography>
                                  {`${row.staff.first_name} ${row.staff.last_name}`}
                                </Typography>
                                {(session?.user?.roles?.includes("Owner") ||
                                  (session?.user?.roles?.includes("BackOfficeUser") &&
                                    checkAccess(
                                      session.user.accessrights
                                        ?.controls as AccessRights2,
                                      "/admin/orders",
                                      "edit"
                                    ))) && row.order_status?.toUpperCase() !== "FAILED" && row.order_status?.toUpperCase() !== "COMPLETED" && row.order_status?.toUpperCase() !== "CANCELLED" && (
                                    <Tooltip title="Edit Staff">
                                      <IconButton onClick={() => handleEditStaff(row)} size="small">
                                        <EditIcon className="text-base text-blue-600" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                              </Box>
                            ) : (
                              <Box display="flex" alignItems="center" justifyContent="center" gap={1.5}>
                                <Typography color="text.secondary">Unassigned</Typography>
                                {(session?.user?.roles?.includes("Owner") ||
                                  (session?.user?.roles?.includes("BackOfficeUser") &&
                                    checkAccess(
                                      session.user.accessrights
                                        ?.controls as AccessRights2,
                                      "/admin/orders",
                                      "edit"
                                    ))) && row.order_status?.toUpperCase() !== "FAILED" && row.order_status?.toUpperCase() !== "COMPLETED" && row.order_status?.toUpperCase() !== "CANCELLED" && (
                                    <Tooltip title="Edit Staff">
                                      <IconButton onClick={() => handleEditStaff(row)} size="small">
                                        <EditIcon className="text-base text-blue-600" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                              </Box>
                            )}
                          </TableCell>

                          <TableCell sx={{ display: "flex", justifyContent: "center", ...tableCellCommonStyling }}>
                            {(session?.user?.roles?.includes("Owner") ||
                              (session?.user?.roles?.includes("BackOfficeUser") &&
                                checkAccess(
                                  session.user.accessrights
                                    ?.controls as AccessRights2,
                                  "/admin/orders",
                                  "edit"
                                ))) && (<Stack direction="row" spacing={0}>
                                  <IconButton onClick={()=>handlePrint(row)} color="primary">
                                    <PrintIcon className="size-[20px] text-blue-600" />
                                  </IconButton>
                                  {row.order_status !== "COMPLETED" && row.order_status !== "CANCELLED" && (
                                    <>
                                      {row.order_status !== "CONFIRMED" && (<>
                                        <Tooltip title={t("approve", keys)}>
                                          <Fab
                                            size="small"
                                            className="bg-background-paper text-green-600"
                                            onClick={() => handleUpdateOrderStatus(row.id, "CONFIRMED")}
                                          >
                                            <IconThumbUp className="size-[20px]" />
                                          </Fab>
                                        </Tooltip>

                                        <Tooltip title={t("uapprove", keys)}>
                                          <Fab
                                            size="small"
                                            className="bg-background-paper text-red-600"
                                            onClick={() => handleUpdateOrderStatus(row.id, "CANCELLED")}
                                          >
                                            <IconThumbDown className="size-[20px]" />
                                          </Fab>
                                        </Tooltip></>)}


                                      {row.order_status === "CONFIRMED" && (
                                        <Tooltip title={t("complete", keys)}>
                                          <Fab
                                            size="small"
                                            className="bg-background-paper text-blue-600"
                                            onClick={() => handleUpdateOrderStatus(row.id, "COMPLETED")}
                                          >
                                            <CheckCircleOutlineIcon className="size-[20px]" />
                                          </Fab>
                                        </Tooltip>
                                      )}
                                    </>
                                  )}
                                  {row.order_status === "COMPLETED" && (
                                    <Tooltip title={t("completed", keys)}>
                                      <Fab
                                        size="small"
                                        className="bg-background-paper text-green-600"
                                      >
                                        <CheckCircleIcon className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                  )}
                                  <Tooltip title={t("view", keys)}>
                                    <Fab size="small" className="bg-background-paper" onClick={() => setOrder(row)}>
                                      <IconEye className="text-blue-600" size={18} />
                                    </Fab>
                                  </Tooltip>

                                  {row.payment_status === "PENDING" && row.payment_method?.toLowerCase() === "qr" && (
                                    <Tooltip title={t("scan_qr", keys)}>
                                      <Fab
                                        size="small"
                                        className="ml-2 bg-background-paper text-blue-600"
                                        onClick={() => {
                                          setOpenQrCodeDialog(true);
                                          setSelectedItem(row);
                                        }}
                                      >
                                        <QrCodeScannerIcon className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                  )}

                                  {row.payment_status === "PENDING" && row.payment_method?.toLowerCase() === "cash" && (
                                    <Tooltip title={t("pay", keys)}>
                                      <Fab
                                        size="small"
                                        className="ml-2 bg-background-paper text-green-600"
                                        onClick={() => handleMarkAsPaid(row.id)}
                                      >
                                        <AttachMoneyIcon className="size-[20px]" />
                                      </Fab>
                                    </Tooltip>
                                  )}

                                  {/* {(row?.order_status !== "COMPLETED" && row.order_transaction?.payment_status !== "SUCCESS") && (session?.user?.roles?.includes("Owner") ||
                          (session?.user?.roles?.includes("BackOfficeUser") &&
                            checkAccess(session.user.accessrights?.controls as AccessRights2, "/orders", "delete"))) ? (
                          <Tooltip title={t("delete", keys)}>
                            <Fab size="small" className="bg-background-paper" onClick={() => setOpenDeleteDialog(row)}>
                              <IconTrash className="text-red-500" size={18} />
                            </Fab>
                          </Tooltip>
                        ) : null} */}
                                </Stack>)}
                          </TableCell>

                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[25, 50, 75, 100, 150, 200, 500]}
                labelRowsPerPage={t("rows_per_page:", keys)}
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
              {openDeleteDialog && (
                <DeleteConfirmationDialog
                  open={openDeleteDialog}
                  itemName={openDeleteDialog.order_number || ""}
                  onConfirm={deleteOrder}
                  onCancel={() => setOpenDeleteDialog(null)}
                />
              )}
              {order && (
                <Dialog
                  open={Boolean(order)}
                  onClose={(event, reason) => {
                    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
                    setOrder(null);
                  }}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="h6">{t("order_details", keys)}</Typography>
                    <IconButton onClick={() => setOrder(null)}>
                      <IconX size={20} />
                    </IconButton>
                  </DialogTitle>

                  <DialogContent dividers>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {t("order_by", keys)}
                        </Typography>

                        <Typography>
                          {t("order_by", keys)}: {order?.is_customer ? "CUSTOMER" : "ADMIN"}
                        </Typography>

                        <Typography>
                          {t("name", keys)}:{" "}
                          {order.is_customer ? `${order?.customers?.firstname} ${order?.customers?.lastname}` : `${order?.user?.first_name} ${order?.user?.last_name}`}
                        </Typography>

                        <Typography>
                          {t("email", keys)}:{" "}
                          {order?.is_customer
                            ? order?.customers?.email
                            : order?.user?.email}
                        </Typography>

                        <Typography>
                          {t("phone", keys)}:{" "}
                          {order?.is_customer
                            ? order?.customers?.phone
                            : order?.user?.phone}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}><Divider /></Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {t("order_info", keys)}
                        </Typography>
                        <Typography>{t("order_number", keys)}: {order.order_number}</Typography>
                        <Typography>{t("status", keys)}: {getStatusLabel(order.order_status)}</Typography>
                        <Typography>
                          {t("created_at", keys)}: {moment(order.created_at).format("DD/MM/YYYY h:mm A")}
                        </Typography>
                        <Typography>
                          {t("total_price", keys)}: {getCurrencySymbol("usd")} {order.total_price.toFixed(2)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}><Divider /></Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {t("order_items", keys)}
                        </Typography>

                        {order.order_details.map((item: any, idx: number) => (
                          <Box key={idx} sx={{ mb: 1 }}>
                            <Typography>
                              {t("service_name", keys)}: {item.item_name}
                            </Typography>
                            <Typography>
                              {t("price", keys)}: {getCurrencySymbol("usd")} {item.item_price}
                            </Typography>
                            <Typography>
                              {t("quantity", keys)}: {item.quantity}
                            </Typography>
                            <Typography>
                              {t("total", keys)}: {getCurrencySymbol("usd")} {item.item_price * item.quantity}
                            </Typography>
                          </Box>
                        ))}
                      </Grid>

                      <Grid item xs={12}><Divider /></Grid>

                      {order.order_transaction && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {t("transaction_details", keys)}
                          </Typography>
                          <Typography>
                            {t("payment_method", keys)}: {order.order_transaction.type}
                          </Typography>
                          <Typography>
                            {t("payment_status", keys)}: {getStatusLabel(order.order_transaction.payment_status)}
                          </Typography>
                          <Typography>
                            {t("amount", keys)}: {getCurrencySymbol("usd")} {order.order_transaction.amount}
                          </Typography>
                          {order.order_transaction.type.toLowerCase() === "card" && (
                            <>
                              <Typography>
                                {t("stripe_status", keys)}: {order.order_transaction.transaction_detail?.stripe_status}
                              </Typography>
                              <Typography>
                                {t("payment_type", keys)}: {order.order_transaction.transaction_detail?.payment_method}
                              </Typography>
                            </>
                          )}
                        </Grid>
                      )}
                    </Grid>
                  </DialogContent>
                </Dialog>
              )}

            </Box>
            <AssignStaffDialog
              open={openAssignStaffDialog}
              orderId={selectedItem?.id}
              staffId={selectedStaffId}
              onClose={() => { setOpenAssignStaffDialog(false); setRefresh((prev) => !prev) }}
              onAssignSuccess={() => { fetchOrders(); setOpenAssignStaffDialog(false); }}
            />
            <QRScanPaymentDialog
              open={openQrCodeDialog}
              onClose={() => { setOpenQrCodeDialog(false); setRefresh((prev) => !prev); }}
              order={selectedItem}
              setPaymentSuccessCheck={setPaymentSuccess}
            />
          </PageContainer>) : (<AccessDenied />)}
    </>

  );
};

export default OrderListing;
