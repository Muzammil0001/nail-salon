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
  IconButton,
  MenuItem,
  Menu,
} from "@mui/material";
import {
  IconBuilding,
  IconEdit,
  IconPower,
  IconTrash,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import { Clear as RemoveIcon } from "@mui/icons-material";
import { Check } from "@mui/icons-material";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { IconPlus } from "@tabler/icons-react";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import { useRouter } from "next/router";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import { useSession } from "next-auth/react";
import { debounce } from "lodash";
import DeleteConfirmationDialog from "../common/DeleteConfirmationDialog";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "../common/ToastMessages";
import { useSelector } from "@/store/Store";
import { t } from "../../../lib/translationHelper";
import { checkAccess } from "../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import AccessDenied from "../NoAccessPage";
const HEADERS = ["name", "email", "type", "action"];

const UserListing = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState({
    isOpen: false,
    itemName: "",
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isColumnSelection, setIsColumnSelection] = useState<boolean>(false);
  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "users" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const [filters, setFilters] = useState({
    type: [] as string[],
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

  const handleEdit = async (row: Record<string, any>) => {
    router.push({
      pathname: "/admin/users/manage",
      query: {
        action: "view",
        id: row.id,
      },
    });
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(0);
        fetchUsers(value);
      }, 300),
    []
  );

  const fetchUsers = useCallback(
    async (searchTerm = search) => {
      try {
        setLoading(true);
        const { data } = await axios.post("/api/users/fetchusers", {
          rowsPerPage,
          page,
          search: searchTerm,
        });
        setUsers(data.users);
        setCount(data.count);
        setFilteredUsers(data.users);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
    [refresh, rowsPerPage, page, triggerSearch, search]
  );

  useEffect(() => {
    fetchUsers();
  }, [refresh, rowsPerPage, page, triggerSearch, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    let filtered = [...(users || [])];
    if (filters.type.length > 0) {
      filtered = filtered.filter((user: any) =>
        user.user_to_role?.some((role: any) =>
          filters.type.includes(role.role.name)
        )
      );
    }
    setFilteredUsers(filtered);
  }, [filters.type, users]);

  const handleOpenDeleteDialog = (id: number, itemName: string) => {
    setOpenDeleteDialog({ isOpen: true, itemName: `${itemName}` });
    setDeleteId(id);
  };

  const deleteUser = async (id: number) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/users/deleteuser", {
        id: id,
      });
      ToastSuccessMessage(response?.data?.message || "deleted!");
      setRefresh((prev) => !prev);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
      setOpenDeleteDialog({ isOpen: false, itemName: "" });
    }
  };
  const changeStaus = async (id: number) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/users/changestatus", {
        id,
      });
      ToastSuccessMessage(response?.data?.message || "status_updated!");
      setRefresh((prev) => !prev);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const types = useMemo(() => {
    // Extract role names from all user roles
    const roleTypes = users.flatMap(
      (user: any) => user.user_to_role?.map((role: any) => role.role.name) || []
    );
    return Array.from(new Set(roleTypes));
  }, [users]);

  const handleColumnSelectionChange = (headCell: string) => {
    setSelectedColumns((prevSelected) => {
      if (prevSelected.includes(headCell)) {
        return prevSelected.filter((col) => col !== headCell);
      } else {
        return [...prevSelected, headCell];
      }
    });
  };

  const handleRemoveClick = () => {
    setIsColumnSelection(false);
    setDownloadTriggered(false);
  };

  const handleClose = () => {
    setIsColumnSelection(false);
    setDownloadAnchorEl(null);
    setSelectedColumns([]);
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

  const handleDownloadClick = async (downloadFormat: string) => {
    try {
      const updatedColumns = HEADERS.filter((col) =>
        selectedColumns.includes(col) && col !== "action"
      );

      const rows = filteredUsers?.map((item: any) => {
        const row: any = {};
        updatedColumns.forEach((col: string) => {
          switch (col) {
            case "name":
              row[col] = item.first_name + " " + item.last_name || "N/A";
              break;
            case "email":
              row[col] = item.email || "N/A";
              break;
            case "type":
              row[col] = item.user_to_role?.map((r: any) => r.role.name).join(", ") || "N/A";
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
          filename: "users_report",
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
      a.download = `users_report.${fileExtension}`;
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

  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
  };

  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/users")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            (session.user as any).accessrights
              ?.controls as AccessRights2,
            "/admin/users",
            "view"
          ))) ? (<PageContainer
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
                <div className="flex items-center gap-2">
                  {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/users")) ||
                    (session?.user?.roles?.includes("BackOfficeUser") &&
                      checkAccess(
                        (session.user as any).accessrights
                          ?.controls as AccessRights2,
                        "/admin/users",
                        "add"
                      ))) && (<Button
                        onClick={() =>
                          router.push({
                            pathname: "/admin/users/manage",
                            query: { action: "create" },
                          })
                        }
                        className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium "
                        startIcon={<IconPlus className="text-[#2276FF]" />}
                      >
                        {t("add_user", keys)}
                      </Button>)}
                  {/* <Box className="flex items-center cursor-pointer justify-center bg-white size-12 text-[#2276FF] hover:opacity-90 hover:bg-white hover:text-[#2276FF] relative">
              <EditNoteIcon sx={{ color: "#2276FF" }} />
            </Box> */}
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
                </div>
              </Box>
            }
          >
            <Loader loading={loading} />
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
                      {HEADERS.map((headCell, index) => (
                        <TableCell
                          key={index}
                          sx={{
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
                                  textAlign:
                                    headCell === "action" ? "center" : "left",
                                  fontSize: "16px",
                                  textTransform: "capitalize",
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
                    {filteredUsers?.map((row: any, index) => {
                      return (
                        <TableRow>
                          <TableCell
                            sx={{
                              boxShadow:
                                "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                            }}
                          >
                            {row.first_name + "  " + row.last_name}
                          </TableCell>
                          {/* <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      {row.username}
                    </TableCell> */}
                          <TableCell
                            sx={{
                              boxShadow:
                                "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                            }}
                          >
                            {row.email}
                          </TableCell>
                          <TableCell
                            sx={{
                              boxShadow:
                                "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                            }}
                          >
                            {row.user_to_role
                              ?.map((r: any) => r.role.name)
                              .join(", ") || "-"}
                          </TableCell>

                          <TableCell
                            sx={{
                              boxShadow:
                                "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems={"center"}
                              justifyContent={"center"}
                            >
                              {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/users")) ||
                                (session?.user?.roles?.includes("BackOfficeUser") &&
                                  checkAccess(
                                    (session.user as any).accessrights
                                      ?.controls as AccessRights2,
                                    "/admin/users",
                                    "edit"
                                  ))) && (<>
                                    <Tooltip title={t("edit", keys)}>
                                      <IconButton
                                        className="text-blue-600"
                                        size="small"
                                        onClick={() => handleEdit(row)}
                                        disabled={row.active_status === false}
                                      >
                                        <IconEdit size={18} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t("status", keys)}>
                                      <IconButton
                                        className={
                                          row.active_status
                                            ? "text-[#10b981]"
                                            : "text-[#ef4444]"
                                        }
                                        // color={device.active_status ? 'error' : 'success'}
                                        size="small"
                                        onClick={() => {
                                          changeStaus(row.id);
                                        }}
                                      >
                                        <IconPower size={18} />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/users")) ||
                                (session?.user?.roles?.includes("BackOfficeUser") &&
                                  checkAccess(
                                    (session.user as any).accessrights
                                      ?.controls as AccessRights2,
                                    "/admin/users",
                                    "delete"
                                  ))) && (<Tooltip title={t("delete", keys)}>
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() => {
                                        handleOpenDeleteDialog(row.id, row.first_name);
                                      }}
                                    >
                                      <IconTrash size={18} className="text-[#dc2626]" />
                                    </IconButton>
                                  </Tooltip>)}
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
                  ".MuiTablePagination-actions": { marginLeft: "auto !important" },
                  ".MuiTablePagination-spacer": { display: "none !important" },
                }}
              />
              <DeleteConfirmationDialog
                open={openDeleteDialog.isOpen}
                itemName={openDeleteDialog.itemName || ""}
                onConfirm={() => {
                  !!deleteId && deleteUser(deleteId);
                }}
                onCancel={() => setOpenDeleteDialog({ isOpen: false, itemName: "" })}
              />
            </Box>
          </PageContainer>) : (<AccessDenied />)}
    </>

  );
};

export default UserListing;
