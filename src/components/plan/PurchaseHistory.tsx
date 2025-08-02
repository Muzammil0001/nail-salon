/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
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
  Badge,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  DialogTitle,
  Tooltip,
  IconButton,
  MenuItem,
  Menu,
  Grid,
  Paper,
} from "@mui/material";
import Image from "next/image";
import { Stack } from "@mui/system";
import axios from "axios";
import Loader from "../loader/Loader";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ToastErrorMessage } from "../common/ToastMessages";
import moment from "moment";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import CustomeDatePicker from "../datetime/DateTImePicker";
import { Check } from "@mui/icons-material";
import { Clear as RemoveIcon } from "@mui/icons-material";
import { useSession } from "next-auth/react";
import { IconEye } from '@tabler/icons-react';

interface SelectedItem {
  id: number;
  client_id: string;
  psp_reference: string;
  eventCode: string;
  eventDate: string;
  client_account_code: string;
  shopper_refrence: string;
  currency: string;
  value: string;
  payment_method: string;
  success: boolean;
  shopper_reference: string;
  recurring_detail_reference: string;
  card_summary: string;
  card_holder_name: string;
  checkout_session_id: string;
  additional_data: { browser: string; ipAddress: string };
  created_at: string;
  updated_at: string;
  card_bin: string;
  affiliate_id: number;
  deleted_status: boolean;
  partner_id: number;
};


const PurchaseHistory = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: any;
}) => {
  const { data: session, status }: any = useSession({
    required: true,
  });
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Record<string, any>[]>([]);
  const [filters, setFilters] = useState({ from: null, to: null, });
  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);
  const [isColumnSelection, setIsColumnSelection] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const [singleDownloadAnchorEl, setSingleDownloadAnchorEl] = useState(null);

  const handleSingleDownloadClick = (event: any) => {
    setSingleDownloadAnchorEl(event.currentTarget);
  };

  const handleSingleDownloadClose = () => {
    setSingleDownloadAnchorEl(null);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClose = () => {
    setDownloadAnchorEl(null);
    handleSingleDownloadClose();
    setIsDetailModalOpen(false)
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
  const handleDownloadClick = async (downloadFormat: string, id?: number) => {
    const downloadPayload = {
      columns: selectedColumns,
      filters,
      downloadFormat,
      rowsPerPage,
      page,
    };
    try {
      if (!id && (downloadPayload.columns as any[])?.length === 0) {
        ToastErrorMessage("At least one perchase detail's field is required to download the report");
      }
      else if (downloadPayload.columns || (Array.isArray(downloadPayload.columns) && (downloadPayload.columns as any[])?.length > 0)) {
        let apiPath = id ? "/api/plans/downloadsingleplanhistory" : "/api/plans/downloadplanhistory"

        const response = await axios.post(
          apiPath,
          id ? { id, downloadFormat } : downloadPayload,
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
        a.download = `plan-perchase-report.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

    } catch (error) {
      console.error("Download error:", error);
    }
    handleClose();

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
  const handleRemoveClick = () => {
    setIsColumnSelection(false);
    setDownloadTriggered(false);
  };

  useEffect(() => {
    const getTransactions = async () => {
      try {
        setLoading(true);

        const filterPayload = {
          from: filters.from ? moment(filters.from).format("YYYY-MM-DD") : null,
          to: filters.to ? moment(filters.to).format("YYYY-MM-DD") : null,
        };

        const response = await axios.post("/api/plans/gettransactions", { filters: filterPayload });
        setTransactions(response.data);
      } catch (error: any) {
        ToastErrorMessage(error)
      } finally {
        setLoading(false);
      }
    };

    getTransactions();
  }, [open, filters]);

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const HEADERS = ["name", "date", "amount", "status", "action"];

  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
  };
  return (

    <> <Dialog open={open} fullWidth maxWidth="lg"
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(5px)",
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", marginBottom: "10px", color: "#666666", padding: "30px 0" }}>{t("purchase_history")}</DialogTitle>
      <DialogContent>
        <Loader loading={loading} />

        <Box className="w-full flex justify-between items-center pt-4">
          <Box className="flex gap-2 items-center ">

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

          <Box className="relative">
            <Box
              onClick={handleDownloadOptionsClick}
              className="flex items-center cursor-pointer justify-center text-white size-12 me-2 bg-[#2276FF] hover:opacity-90 hover:bg-[#2276FF] hover:text-white relative"
            >
              <SaveAltIcon sx={{ color: "#2FFFFFF" }} />
            </Box>
            <Menu
              sx={{ left: -4, top: 2 }}
              anchorEl={downloadAnchorEl}
              open={Boolean(downloadAnchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleDownloadClick("pdf")}>
                {t("download_pdf")}
              </MenuItem>
              <MenuItem onClick={() => handleDownloadClick("excel")}>
                {t("download_excel")}
              </MenuItem>
            </Menu>
            {isColumnSelection && (
              <IconButton
                onClick={handleRemoveClick}
                className="absolute -top-2 -right-2 !z-10 bg-red-600 hover:bg-red-500 border-2 border-gray-300 p-1 rounded-full hover:border hover:border-white"
                size="small"
              >
                <RemoveIcon sx={{ color: "#ffffff", fontSize: "small" }} />
              </IconButton>
            )}
          </Box>
        </Box>
        <TableContainer className="rounded-lg mt-10">
          <Table
            sx={{
              width: "100%",
              borderCollapse: "separate",
            }}
            aria-labelledby="tableTitle"
          >
            <TableHead>
              <TableRow>
                {HEADERS.map((headCell, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      border: "1px solid #DCE0E380",
                      maxWidth: "100px",
                      textAlign: headCell === "action" ? "center" : "left",
                      verticalAlign: "top",
                      ...tableCellCommonStyling,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          gap: isColumnSelection ? "4px" : "0px",
                          justifyContent:
                            headCell === "action" ? "center" : "flex-start",
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
                          }}
                        >
                          {t(headCell)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? transactions.slice(
                  page * rowsPerPage,
                  page * rowsPerPage + rowsPerPage
                )
                : transactions
              )?.map((row, index) => {
                const sortedPrices = [...transactions]
                  .map((transaction) => parseFloat(transaction.value))
                  .sort((a, b) => b - a);

                const priceRank = sortedPrices.indexOf(parseFloat(row.value));

                let planImage;
                if (sortedPrices.every(price => price === sortedPrices[0])) {
                  planImage = "/images/logos/premiumPlanLogo.png";
                } else if (priceRank === 0) {
                  planImage = "/images/logos/premiumPlanLogo.png";
                } else if (priceRank === 1) {
                  planImage = "/images/logos/goldPlanLogo.png";
                } else {
                  planImage = "/images/logos/basicPlanLogo.png";
                }

                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      <Stack spacing={2} direction="row" alignItems="center">
                        <Image src={planImage} alt="plan" width={25} height={25} />
                        <Typography>{row.card_holder_name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      <Typography color="textSecondary" variant="body1">
                        {moment(row.created_at).format("DD-MM-YYYY")}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      <Typography>
                        € {(parseFloat(row.value) / 100).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      <Stack spacing={1} direction="row" alignItems="center">
                        <Typography
                          sx={{ color: row.success ? "#06B217" : "#D32030", fontWeight: "500" }}
                          variant="body1">
                          {row.success ? "Active" : "Inactive"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      <Box className="flex gap-2 items-center justify-center">
                        <Tooltip title={t("view")} arrow>
                          <IconButton color="primary" onClick={() => handleViewDetails(row)}>
                            <IconEye stroke={2} className="size-5" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Save">
                          <div className="relative inline-block">
                            <IconButton color="primary" onClick={handleSingleDownloadClick}>
                              <SaveAltIcon className="size-5" />
                            </IconButton>
                            <Menu
                              anchorEl={singleDownloadAnchorEl}
                              open={Boolean(singleDownloadAnchorEl)}
                              onClose={handleSingleDownloadClose}
                              sx={{
                                "& .MuiPaper-root": {
                                  boxShadow: "none",
                                  border: "1px solid #e0e0e0",
                                  borderRadius: "8px",
                                },
                                "& .MuiMenuItem-root": {
                                  padding: "8px 16px",
                                  "&:hover": {
                                    backgroundColor: "#f5f5f5",
                                  },
                                },
                              }}
                            >
                              <MenuItem onClick={() => handleDownloadClick("pdf", row?.id)}>
                                {t("download_pdf")}
                              </MenuItem>
                              <MenuItem onClick={() => handleDownloadClick("excel", row?.id)}>
                                {t("download_excel")}
                              </MenuItem>
                            </Menu>
                          </div>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>


          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={transactions.length}
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
      </DialogContent>
      <DialogActions className="px-6 my-2">
        <Button
          onClick={() => setOpen(false)}
          variant="outlined"
          sx={{ height: "50px", width: "145px" }}
        >
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
      {isDetailModalOpen &&

        <Dialog open={isDetailModalOpen} onClose={handleClose} fullWidth maxWidth="md">
          <DialogTitle sx={{ backgroundColor: "#2276FF", color: "#fff" }}>
            {t("Transaction Details")}
          </DialogTitle>
          <DialogContent>
            {selectedItem ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper elevation={3} sx={{ padding: 3, backgroundColor: "#f5f5f5", mt: "20px" }}>
                    <Typography variant="h6" gutterBottom sx={{ color: "#2276FF", marginBottom: 2 }}>
                      {t("Basic Information")}
                    </Typography>
                    <Typography variant="body1"><strong>{t("ID")}:</strong> {selectedItem?.id || "--"}</Typography>
                    <Typography variant="body1"><strong>{t("Client Account")}:</strong> {selectedItem?.client_account_code || "--"}</Typography>
                    <Typography variant="body1"><strong>{t("Currency")}:</strong> {selectedItem?.currency || "00.00"}</Typography>
                    <Typography variant="body1"><strong>{t("Payment Method")}:</strong> {selectedItem?.payment_method || "--"}</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper elevation={3} sx={{ padding: 3, backgroundColor: "#f5f5f5", }}>
                    <Typography variant="h6" gutterBottom sx={{ color: "#2276FF", marginBottom: 2 }}>
                      {t("Transaction Details")}
                    </Typography>
                    <Typography variant="body1"><strong>{t("Transaction Value")}:</strong> €{parseFloat(selectedItem?.value).toFixed(2)}</Typography>
                    <Typography variant="body1"><strong>{t("Event Date")}:</strong> {new Date(selectedItem?.eventDate).toLocaleString()}</Typography>
                    <Typography variant="body1"><strong>{t("Transaction Status")}:</strong> {selectedItem?.success ? t("Active") : t("Inactive")}</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper elevation={3} sx={{ padding: 3, backgroundColor: "#f5f5f5" }}>
                    <Typography variant="h6" gutterBottom sx={{ color: "#2276FF", marginBottom: 2 }}>
                      {t("Card Information")}
                    </Typography>
                    <Typography variant="body1"><strong>{t("Card Summary")}:</strong> {selectedItem.card_summary}</Typography>
                    <Typography variant="body1"><strong>{t("Card Holder")}:</strong> {selectedItem.card_holder_name}</Typography>
                    <Typography variant="body1"><strong>{t("Checkout Session ID")}:</strong> {selectedItem.checkout_session_id}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1" color="textSecondary" sx={{ textAlign: "center", textTransform: "capitalize", padding: "20px 0 0 0" }}>
                {t("no data found")}
              </Typography>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} variant="outlined"
              sx={{ height: "50px", width: "145px", marginRight: "10px" }}
            >
              {t("close")}
            </Button>
          </DialogActions>
        </Dialog>
      }
    </>
  );
};

export default PurchaseHistory;
