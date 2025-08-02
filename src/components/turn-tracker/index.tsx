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
  IconButton,
  MenuItem,
  Select,
  Chip,
  Menu,
} from "@mui/material";
import ThresholdDialog from "./addThresholdDialog";
import { IconPlus } from "@tabler/icons-react";
import AutorenewIcon from '@mui/icons-material/Autorenew';
import axios from "axios";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import { useRouter } from "next/router";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import { SelectChangeEvent } from "@mui/material/Select";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { Clear as RemoveIcon } from "@mui/icons-material";
import { Check } from "@mui/icons-material";
import DeleteConfirmationDialog from "../common/DeleteConfirmationDialog";
import { debounce } from "lodash";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { checkAccess } from "../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import { useSelector } from "@/store/Store";
import { t } from "../../../lib/translationHelper";
import AccessDenied from "../NoAccessPage";
const HEADERS = [
  "staff_name",
  "total_tickets",
  "earned_points",
];

const TurnTrackerListing = ({ session }: any) => {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [rotationTurns, setRotationTurns] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [isColumnSelection, setIsColumnSelection] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [currentTurnStaff, setCurrentTurnStaff] = useState<any | null>(null);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "turn_tracker" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const handleClose = () => {
    setAnchorEl(null);
    setDownloadAnchorEl(null);
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

  const fetchTurns = useCallback(
    async (searchTerm = search) => {
      try {
        setLoading(true);
        const response = await axios.post("/api/turntracker/fetchturns", {
          rowsPerPage,
          page,
          search: searchTerm,
        });

        let result = response.data.data.rotations;

        setRotationTurns(result);
        setCurrentTurnStaff(response.data.data.current_turn_staff)
        setCount(response.data.data.count ?? 0);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
    [
      rowsPerPage,
      page,
      session?.user.selected_location_id,
      search,
    ]
  );


  useEffect(() => {
    fetchTurns();
  }, [rowsPerPage, page, triggerSearch]);


  const handleDownloadClick = async (downloadFormat: string) => {
    try {
      const updatedColumns = HEADERS.filter((col) =>
        selectedColumns.includes(col)
      );

      const rows = rotationTurns?.map((item: any) => {
        const row: any = {};
        updatedColumns.forEach((col: string) => {
          switch (col) {
            case "staff_name":
              row[col] = item.name;
              break;
            case "total_tickets":
              row[col] = item?.total_reservations ?? 0;
              break;
            case "earned_points":
              row[col] = item?.points?.toFixed(2) ?? 0;
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
          filename: `${t("turn_tracker_report", keys)}`,
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
      a.download = `${t("turn_tracker_report", keys)}.${fileExtension}`;
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
    setDownloadAnchorEl(null);
    setSelectedColumns([]);
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

  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
  };
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(0);
        fetchTurns(value);
      }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const isAcc=(
    (session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/turn-tracker")) ||
    (session?.user?.roles?.includes("BackOfficeUser") &&
      checkAccess(
        (session.user as any).accessrights?.controls as AccessRights2,
        "/admin/turn-tracker",
        "view"
      ))
  ) 
  console.log("====== ~ TurnTrackerListing ~ isAcc:", isAcc)
  return (
    <>
      {(
        (session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/turn-tracker")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            (session.user as any).accessrights?.controls as AccessRights2,
            "/admin/turn-tracker",
            "view"
          ))
      ) ? (<PageContainer
        css={{ padding: "0px" }}
        topbar={
          <Box className="w-full flex justify-between items-center">
            <Box className="flex gap-2 items-center">
              <CustomSearch
                value={search}
                onChange={handleSearchChange}
                onSearchClick={() => debouncedSearch(search)}
                placeholder={t("search", keys)}
                onClearClick={() => {
                  setIsColumnSelection(false);
                  setDownloadAnchorEl(null);
                  setSelectedColumns([]);
                  if (search) {
                    setSearch("");
                    setTriggerSearch((prev) => !prev);
                  }
                }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {(((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/turn-tracker")) ||
                (session?.user?.roles?.includes("BackOfficeUser") &&
                  checkAccess(
                    (session.user as any).accessrights
                      ?.controls as AccessRights2,
                    "/admin/turn-tracker",
                    "edit"
                  ))) && ((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/turn-tracker")) ||
                    (session?.user?.roles?.includes("BackOfficeUser") &&
                      checkAccess(
                        (session.user as any).accessrights
                          ?.controls as AccessRights2,
                        "/admin/turn-tracker",
                        "add"
                      )))) && (<Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium "
                        startIcon={<IconPlus className="text-[#2276FF]" />}
                      >
                        {t("set_appointment_threshold", keys)}
                      </Button>)}

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
        <Box>
          <TableContainer className="rounded-lg">
            <Table
              sx={{
                width: "100%",
                borderCollapse: "separate",
              }}
              aria-labelledby="tableTitle"
            >
              <TableHead sx={{ height: "70px" }}>
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
                        maxWidth: "130px",
                        textAlign: headCell === "action" ? "center" : "left",
                        ...tableCellCommonStyling,
                        padding: "10px",
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
                          <div className="flex 2xl:flex-row flex-col justify-start items-start">
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                marginRight: "4px",
                                borderRadius: "8px",
                                gap: "8px",
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

                            <Box sx={{ display: "flex" }}>
                              <Typography
                                fontWeight="700"
                                sx={{
                                  textAlign:
                                    headCell === "action" ? "center" : "left",
                                  fontSize: "16px",
                                  textTransform: "capitalize",
                                }}
                              >
                                {t(headCell, keys)}
                              </Typography>
                            </Box>
                          </div>
                        </Box>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rotationTurns?.map((turn: any, index: number) => {
                  return (
                    <TableRow key={index}>
                      <TableCell
                        sx={{
                          ...tableCellCommonStyling,
                          textTransform: "capitalize",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography>{turn.name || "--"}</Typography>

                        {turn.id === currentTurnStaff.id && (
                          <AutorenewIcon
                            titleAccess="Current Turn"
                            className="text-green-500"
                            sx={{
                              animation: "spin 2s linear infinite",
                              "@keyframes spin": {
                                from: { transform: "rotate(0deg)" },
                                to: { transform: "rotate(360deg)" },
                              },
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell sx={{ ...tableCellCommonStyling }}>
                        {turn.total_reservations || 0}
                      </TableCell>

                      <TableCell sx={{ ...tableCellCommonStyling }}>
                        {turn.points?.toFixed(2) || 0.0}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <ThresholdDialog open={dialogOpen} onClose={() => setDialogOpen(false)} t={t} keys={keys} />
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
              ".MuiTablePagination-actions": { marginLeft: "auto !important" },
              ".MuiTablePagination-spacer": { display: "none !important" },
            }}
          />
        </Box>
      </PageContainer>) : (<AccessDenied />)}
    </>
  );
};

export default TurnTrackerListing;
