import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Box,
  MenuItem,
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  Typography,
  Chip,
  Modal,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import { debounce } from "lodash";
import PageContainer from "@/components/container/PageContainer";
import CustomSearch from "@/components/forms/theme-elements/CustomSearch";
import { t } from "../../../lib/translationHelper";
import { Check } from "@mui/icons-material";
import { Clear as RemoveIcon } from "@mui/icons-material";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "@/components/common/ToastMessages";
import Loader from "../loader/Loader";
import { useSelector } from "@/store/Store";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { QRCode } from "react-qrcode-logo";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AccessDenied from "../NoAccessPage";
import { checkAccess } from "../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";

const CustomersListing = ({ session }: any) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isColumnSelection, setIsColumnSelection] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState("");
  const [qrCustomerName, setQrCustomerName] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const qrCodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "customers" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const debouncedSearchHandler = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, 300),
    []
  );

  const fetchData = useCallback(
    async (searchTerm = "", page = 0, rowsPerPage = 25) => {
      try {
        setLoading(true);
        const response = await axios.post("/api/reservation/fetchallcustomers", {
          search: searchTerm,
          page,
          rowsPerPage,
        });

        setData(response.data.customers);
        setCount(response.data.count);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
    [rowsPerPage, page, session?.user.selected_location_id, search]
  );
  useEffect(() => {
    fetchData(debouncedSearch, page, rowsPerPage);
  }, [debouncedSearch, rowsPerPage, page, triggerSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearchHandler(value);
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
    setSelectedColumns([]);
  };

  const handleDownloadClick = async (downloadFormat: string) => {
    try {
      const updatedColumns = HEADERS.filter((col) =>
        selectedColumns.includes(col)
      );
      const rows = data.map((prod: any) => {
        const row: any = {};
        updatedColumns.forEach((col: string) => {
          switch (col) {
            case "name":
              row[col] = prod.name;
              break;
            case "email":
              row[col] = prod.email;
              break;
            case "phone":
              row[col] = prod.phone;
              break;
            case "loyalty_points":
              row[col] = prod?.loyalty_points ?? "0";
              break;
          }
        });
        return row;
      });
      if ((updatedColumns as any[])?.length === 0) {
        ToastErrorMessage("at_least_one_field_is_required_to_export_report");
        return;
      }
      const tableData = {
        headers: updatedColumns.map((c: string) => t(c, keys)),
        rows: rows.map((row: any) =>
          updatedColumns.map((col: any) => row[col] || "N/A")
        ),
      };

      const sheetColumns = updatedColumns.map((col: any) => ({
        header: t(col, keys),
        key: col,
        width: 20,
      }));
      const response = await axios.post(
        "/api/downloads/downloaddata",
        {
          columns: updatedColumns.map((c: string) => t(c, keys)),
          tableData,
          rows,
          sheetColumns,
          filename: "Customers",
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
      a.download = `customers.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }

    setQrModalOpen(false);
  };

  const downloadQRCodePDF = () => {
    if (qrCodeRef.current !== null) {
      setLoading(true);
      const scaleFactor = 1; // Adjust the scale factor as needed

      html2canvas(qrCodeRef.current, {
        scale: scaleFactor,
        useCORS: true,
        allowTaint: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth() / 2;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width / 1.1;
        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          pdfWidth,
          pdfHeight + 20,
          undefined,
          "SLOW"
        );

        const pdfDataUri = pdf.output("bloburl").toString();
        setLoading(false);
        const newTab = window.open();
        newTab?.document.write(
          '<iframe src="' +
          pdfDataUri +
          '" width="100%" height="100%"></iframe>'
        );
        if (newTab) {
          newTab.onbeforeunload = function () {
            URL.revokeObjectURL(pdfDataUri);
          };
        }
      });
    }
  };

  const handleOpenQRModal = (id: string, customerName: string) => {
    setQrData(id);
    setQrCustomerName(customerName);
    setQrModalOpen(true);
  };
  const sendToEmail = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/customers/sendtoemail", {
        id: qrData,
      });
      ToastSuccessMessage(t("email_sent_successfully", keys));
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };
  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
  };

  const HEADERS = [
    "name",
    "email",
    "phone",
    "loyalty_points",
  ];
  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/customers")) ||
        ((session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            session.user.accessrights
              ?.controls as AccessRights2,
            "/admin/customers",
            "view"
          )))) ? (<PageContainer
            css={{ padding: "0px" }}
            topbar={
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <CustomSearch
                    value={search}
                    placeholder={t("search", keys)}
                    onChange={handleSearchChange}
                    onClearClick={() => {
                      handleRemoveClick();
                      setSearch("");
                      setDebouncedSearch("");
                      fetchData("", page, rowsPerPage);
                    }}
                  />

                </div>

                <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              </div>
            }
          >
            <Loader loading={loading} />
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <TableContainer className="rounded-lg">
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
                            minWidth: isColumnSelection ? "140px" : "100px",
                            maxWidth: "230px",
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
                                {isColumnSelection && headCell !== "loyalty_code" && (
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
                                  textAlign:
                                    headCell === "action" ? "center" : "left",
                                  fontSize: "16px",
                                }}
                              >
                                {t(headCell, keys)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {data?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                            fontSize: "16px",
                          }}
                        >
                          {item?.name || "--"}
                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                            fontSize: "16px",
                          }}
                        >
                          {item?.email || "--"}
                        </TableCell>
                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                            fontSize: "16px",
                          }}
                        >
                          {item?.phone || "--"}
                        </TableCell>

                        <TableCell
                          sx={{
                            boxShadow:
                              "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                            fontSize: "16px",
                          }}
                        >
                          {item?.loyalty_points?.toFixed(2) || "0"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[25, 50, 100]}
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

            <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)}>
              <DialogContent>
                <div
                  className="flex justify-center items-center flex-col"
                  ref={qrCodeRef}
                >
                  {qrCustomerName && (
                    <Typography
                      variant="subtitle1"
                      mb={1}
                      sx={{ fontWeight: "bold" }}
                    >
                      {qrCustomerName}
                    </Typography>
                  )}
                  {qrData ? (
                    <QRCode value={qrData} />
                  ) : (
                    <Typography>Generating QR Code...</Typography>
                  )}
                </div>
                <DialogActions>
                  <Button
                    onClick={() => setQrModalOpen(false)}
                    variant="outlined"
                    size="large"
                  >
                    {t("close", keys)}
                  </Button>
                  <Button
                    onClick={downloadQRCodePDF}
                    variant="contained"
                    size="large"
                  >
                    {t("print", keys)}
                  </Button>
                  <Button onClick={sendToEmail} variant="contained" size="large">
                    {t("send_to_email", keys)}
                  </Button>
                </DialogActions>
              </DialogContent>
            </Dialog>
          </PageContainer>) : (<AccessDenied />)}
    </>

  );
};
export default CustomersListing;
