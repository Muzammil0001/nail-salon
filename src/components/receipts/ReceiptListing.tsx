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
  IconButton,
  Select,
  MenuItem,
  Chip,
  Button,
} from "@mui/material";
import { t } from "../../../lib/translationHelper";
import {
  IconEye,
  IconPlus,
  IconPower,
  IconReload,
  IconTransferVertical,
  IconTrash,
  IconEdit
} from "@tabler/icons-react";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { AccessRights2, AlertInterface } from "@/types/admin/types";
import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import Alert from "../alert/Alert";
import { useRouter } from "next/router";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import { debounce } from "lodash";
import { Clear as RemoveIcon } from "@mui/icons-material";
import { useSelector } from "@/store/Store";
import DeleteConfirmationDialog from "../common/DeleteConfirmationDialog";
const headCells = ["name", "type", "default", "status", "action"];
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { checkAccess } from "../../../lib/clientExtras";

const ReceiptListing = ({ session }: any) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [alert, setAlert] = useState<AlertInterface | null>(null);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<any>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "receipt_templates_overview" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const baseFilters = [
    {
      id: "I",
      name: "Invoice",
    },
    {
      id: "K",
      name: "Kitchen",
    },
    {
      id: "B",
      name: "Bar",
    },
    {
      id: "KB",
      name: "Kitchen & Bar",
    },
  ];
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
    debouncedSearch(value);
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/receipts/fetchreceipts", {
          rowsPerPage,
          page,
          search,
          filters,
        });
        setTemplates(response.data.templates);
        setCount(response.data.count);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [refresh, rowsPerPage, page, search, filters]);
  const deleteTemplate = async () => {
    try {
      const response = await axios.post("/api/receipts/deletereceipt", {
        id: openDeleteDialog.id,
      });
      setRefresh((prev) => !prev);
      ToastSuccessMessage(response?.data?.message || "deleted!");
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setOpenDeleteDialog(null);
    }
  };

  const templateStatus = async (id: number, status: boolean) => {
    try {
      const response = await axios.post("/api/receipts/changestatus", {
        id,
        status,
      });
      ToastSuccessMessage(response?.data?.message || "status_updated!");
      setRefresh((prev) => !prev);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };
  const importTemplate = async (row: Record<string, any>) => {
    try {
      const response = await axios.post("/api/receipts/createreceipt", {
        ...row,
        active_status: false,
      });
      ToastSuccessMessage(response?.data?.message || "created!");
      setRefresh((prev) => !prev);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  const handleEdit = async (row: Record<string, any>) => {
    router.push({
      pathname: "/admin/receipts/manage",
      query: {
        action: "edit",
        id: row.id,
      },
    });
  };
  const handleView = async (row: Record<string, any>) => {
    router.push({
      pathname: "/admin/receipts/manage",
      query: {
        action: "view",
        id: row.id,
      },
    });
  };
  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
  };
  const filterSelectCommonStyling = {
    height: "10px",
    boxShadow: "none",
    width: "30px",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent",
    },
    "& .MuiSelect-icon": {
      color: "#000",
    },
  };

  const chipsCommonStyling = {
    color: "#2276FF",
    minWidth: "73px",
    backgroundColor: "transparent",
    height: "25px",
    gap: "10px",
    borderRadius: "3px",
    border: "1px solid #2276FF",
    opacity: 1,
    marginBottom: "2px !important",
    textTransform: "capitalize",
  };
  return (
    <PageContainer
      css={{ padding: "0px" }}
      topbar={
        <Box className="w-full flex justify-between items-center">
          <Box className="flex gap-2 items-center ">
            <CustomSearch
              className="w-full"
              value={search}
              onChange={handleSearchChange}
              placeholder={t("search", keys)}
            />
            <IconButton
              onClick={() => {
                if (search) {
                  debouncedSearch("");
                }
              }}
              className="bg-white text-primary-main size-11 ms-1 hover:opacity-90 hover:bg-white"
            >
              <IconReload size={20} />
            </IconButton>
          </Box>
          <div className="flex items-center gap-2">
            {(session?.user?.roles?.includes("Owner") ||
              session?.user?.roles?.includes("SuperAdmin") ||
              (session?.user?.roles?.includes("BackOfficeUser") &&
                checkAccess(
                  session.user.accessrights?.controls as AccessRights2,
                  "/receipts",
                  "add"
                ))) && (
              <Button
                onClick={() =>
                  router.push({
                    pathname: "/admin/receipts/manage",
                    query: { action: "create" },
                  })
                }
                className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium "
                startIcon={<IconPlus className="text-[#2276FF]" />}
              >
                {t("add_receipt", keys)}
              </Button>
            )}
          </div>
        </Box>
      }
    >
      <Loader loading={loading} />
      <Alert alert={alert} />
      <Box>
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
              <TableRow>
                {headCells.map((headCell, index) => (
                  <TableCell
                    key={index}
                    sx={{
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
                          justifyContent:
                            headCell === "action" ? "center" : "flex-start",
                        }}
                      >
                        <Typography
                          fontWeight="700"
                          sx={{
                            textAlign:
                              headCell === "action" ? "center" : "left",
                            fontSize: "16px",
                            textTransform: "capitalize",
                            textWrap: "nowrap",
                          }}
                        >
                          {t(headCell, keys)}
                        </Typography>
                        <Box>
                          {headCell === "type" && baseFilters && (
                            <Select
                              multiple
                              value={filters}
                              onChange={(e: any) =>
                                setFilters(e.target.value as string[])
                              }
                              displayEmpty
                              renderValue={() => null}
                              sx={{ ...filterSelectCommonStyling }}
                            >
                              <MenuItem
                                disabled
                                sx={{
                                  minWidth: "50px",
                                  textAlign: "center",
                                  color: "gray",
                                  fontStyle: "italic",
                                }}
                              >
                                {t("select_order_by", keys)}
                              </MenuItem>
                              {baseFilters.map((by: any) => (
                                <MenuItem key={by.id} value={by.id}>
                                  {by.name}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        </Box>
                      </Box>
                      <Box>
                        {headCell === "type" && filters.length > 0 && (
                          <Stack
                            mt={1}
                            direction="row"
                            gap={0.5}
                            flexWrap="wrap"
                          >
                            {filters.map((type: string) => (
                              <Chip
                                key={type}
                                label={
                                  baseFilters.find(
                                    (f: Record<string, any>) => f.id === type
                                  )?.name
                                }
                                sx={{ ...chipsCommonStyling }}
                                deleteIcon={
                                  <RemoveIcon
                                    sx={{
                                      backgroundColor: "transparent",
                                      fontWeight: "normal !important",
                                      fontSize: "20px !important",
                                      color: "#2276FF !important",
                                    }}
                                  />
                                }
                                onDelete={() =>
                                  setFilters((prev) =>
                                    prev.filter((f: string) => f !== type)
                                  )
                                }
                              />
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {templates?.map((row: any, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      {row.template_name}
                    </TableCell>
                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      {
                        baseFilters.find(
                          (f: Record<string, any>) => f.id === row.template_type
                        )?.name
                      }
                    </TableCell>
                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      {row.from_superadmin ? "YES" : "NO"}
                    </TableCell>
                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: row.active_status ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {row.active_status ? "ACTIVE" : "INACTIVE"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        boxShadow:
                          "rgba(0, 0, 0, 0.03) 7px 0 10px inset !important",
                      }}
                    >
                      <Stack direction="row" spacing={1}>
                        {row.from_superadmin &&
                        !session?.user?.roles?.includes("SuperAdmin") ? (
                          <>
                            {" "}
                            <Tooltip title={t("import", keys)}>
                              <Fab
                                size="small"
                                className={`bg-background-paper  "text-red-600"`}
                                onClick={() => importTemplate(row)}
                              >
                                <IconTransferVertical
                                  className="text-primary-main"
                                  size={18}
                                />
                              </Fab>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            {(session?.user?.roles?.includes("Owner") ||
                              session?.user?.roles?.includes("SuperAdmin") ||
                              (session?.user?.roles?.includes(
                                "BackOfficeUser"
                              ) &&
                                checkAccess(
                                  session.user.accessrights
                                    ?.controls as AccessRights2,
                                  "/receipts",
                                  "edit"
                                ))) && (
                              <>
                                {/* <Tooltip title={t("view", keys)}>
                                  <Fab
                                    size="small"
                                    className={`bg-background-paper  "text-red-600"`}
                                    onClick={() => handleView(row)}
                                  >
                                    <IconEye
                                      className="text-primary-main"
                                      size={18}
                                    />
                                  </Fab>
                                </Tooltip> */}
                                <Tooltip title={t("edit", keys)}>
                                  <Fab
                                    disabled={!row.active_status}
                                    size="small"
                                    className={`!bg-background-paper`}
                                    onClick={() => handleEdit(row)}
                                  >
                                    <IconEdit
                                      className={`${!row.active_status? "text-slate-350": "text-primary-main"}`}
                                      size={18}
                                    />
                                  </Fab>
                                </Tooltip>
                                <Tooltip title={t("status", keys)}>
                                  <Fab
                                    size="small"
                                    className={`bg-background-paper ${
                                      row.active_status === true
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                    onClick={() =>
                                      templateStatus(row.id, !row.active_status)
                                    }
                                  >
                                    <IconPower size={18} />
                                  </Fab>
                                </Tooltip>
                              </>
                            )}

                            {(session?.user?.roles?.includes("Owner") ||
                              session?.user?.roles?.includes("SuperAdmin") ||
                              (session?.user?.roles?.includes(
                                "BackOfficeUser"
                              ) &&
                                checkAccess(
                                  session.user.accessrights
                                    ?.controls as AccessRights2,
                                  "/receipts",
                                  "delete"
                                ))) && (
                              <Tooltip title={t("remove", keys)}>
                                <Fab
                                  size="small"
                                  className={`bg-background-paper  "text-red-600"`}
                                  onClick={() => setOpenDeleteDialog(row)}
                                >
                                  <IconTrash
                                    className="text-red-500"
                                    size={18}
                                  />
                                </Fab>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
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
        {openDeleteDialog && (
          <DeleteConfirmationDialog
            open={openDeleteDialog}
            itemName={openDeleteDialog.template_name || ""}
            onConfirm={deleteTemplate}
            onCancel={() => setOpenDeleteDialog(null)}
          />
        )}
      </Box>
    </PageContainer>
  );
};

export default ReceiptListing;
