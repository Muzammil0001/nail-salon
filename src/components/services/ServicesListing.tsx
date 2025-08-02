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
  Divider,
  ListItemIcon,
  ListItemText,
  Slider,
} from "@mui/material";
import {
  IconEdit,
  IconPower,
  IconReload,
  IconSoup,
  IconTrash,
  IconSettings,
} from "@tabler/icons-react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { IconPlus } from "@tabler/icons-react";
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
import DndSortTable from "../DndSortTable";
import { IconGripVertical } from "@tabler/icons-react";


const HEADERS = [
  "category",
  "name",
  "duration",
  "price",
  "action",
];
interface SelectedFilters {
  category: string[];
}

const initialFilters = {
  category: [],
};

const ServiceListing = ({ session }: any) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [services, setServices] = useState<any>([]);
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isColumnSelection, setIsColumnSelection] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(
    initialFilters
  );
  const [openDeleteDialog, setOpenDeleteDialog] = useState({
    isOpen: false,
    itemName: "",
  });
  const [categories, setCategories] = useState<any>([]);
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
          { page_name: "services" }
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

  const handleEdit = async (service: any) => {
    router.push({
      pathname: "/admin/services/manage",
      query: {
        action: "view",
        id: service,
      },
    });
  };
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.post("/api/category/fetchcategories", { fetchAll: true });
        setCategories(response?.data?.data);
      } catch (error) {
        ToastErrorMessage(error);
      }
    };
    fetchCategories();
  }, [selectedFilters]);

  const filterData = (data: any[]) => {
    let filtered = data;

    Object.keys(selectedFilters).forEach((key) => {
      if (selectedFilters[key as keyof typeof selectedFilters].length > 0) {
        filtered = filtered.filter((item: any) => {
          if (key === "category") {
            return selectedFilters.category.some(
              (filter) => filter === item?.categories.id
            );
          }
          return true;
        });
      }
    });

    return filtered;
  };
  const fetchServices = useCallback(
    async (searchTerm = search) => {
      try {
        setLoading(true);
        const response = await axios.post("/api/services/fetchservices", {
          rowsPerPage,
          page,
          search: searchTerm,
        });

        let result = response.data.services;

        if (selectedFilters && Object.keys(selectedFilters).length > 0) {
          result = filterData(result);
        }
        setServices(result);
        setCount(result.length);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
    [
      rowsPerPage,
      selectedFilters,
      page,
      session?.user.selected_location_id,
      search,
    ]
  );


  useEffect(() => {
    fetchServices();
  }, [refresh, rowsPerPage, page, triggerSearch, selectedFilters]);

  const deleteProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/services/deleteservice", {
        service_id: deleteId,
      });
      if (response.status === 200) {
        ToastSuccessMessage(response?.data?.message || "deleted!");
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
      setOpenDeleteDialog({ isOpen: false, itemName: "" });
    }
  };
  const statusHander = async (id: number, name: string) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/services/servicestatus", {
        service_id: id,
      });
      if (response) {
        ToastSuccessMessage(response?.data?.message || "status_updated!");
        fetchServices();
      }
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };
  const handleOpenDeleteDialog = (id: number, itemName: string) => {
    setOpenDeleteDialog({ isOpen: true, itemName: `${itemName} Service` });
    setDeleteId(id);
  };
  const handleTypeChange = (
    e: SelectChangeEvent<string[]>,
    filterType: keyof SelectedFilters
  ) => {
    const value = e.target.value;
    setSelectedFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: typeof value === "string" ? value.split(",") : value,
    }));
  };
  const handleDelete = (
    filterType: keyof SelectedFilters,
    item: string | number
  ) => {
    setSelectedFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: prevFilters[filterType].filter(
        (selectedItem) => selectedItem !== item
      ),
    }));
  };
  const handleDownloadClick = async (downloadFormat: string) => {
    try {
      const updatedColumns = HEADERS.filter((col) =>
        selectedColumns.includes(col) && col !== "action"
      );

      const rows = services?.map((item: any) => {
        const row: any = {};
        updatedColumns.forEach((col: string) => {
          switch (col) {
            case "category":
              row[col] = item.categories?.name || "N/A";
              break;
            case "name":
              row[col] = item.name || "N/A";
              break;
            case "image":
              row[col] = item.image || "N/A";
              break;
            case "duration":
              row[col] = item.duration_minutes ?? "0.00";
              break;
            case "price":
              row[col] = item.price?.toFixed(2) ?? "0.00";
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
          filename: `${t("services_report", keys)}`,
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
      a.download = `${t("services_report", keys)}.${fileExtension}`;
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

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(0);
        fetchServices(value);
      }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleReorder = async (newList: any[]) => {
    setCategories(newList);

    const payload = {
      services: newList?.map((s, i) => ({
        id: s.id,
        sort_order: i,
      })),
    };
    try {
      const response = await axios.post("/api/services/reorder", payload);
      // ToastSuccessMessage(response?.data?.message || "Reorder success!");
      setRefresh((prev) => !prev);
    } catch (error) {
      ToastErrorMessage(error);
      console.error("Failed to reorder services:", error);
    }
  };


  const renderRow = (srv: any) => [
    <TableCell
      key="name"
      sx={{
        ...tableCellCommonStyling,
        textTransform: "capitalize",
        display: "flex", gap: 2, alignItems: "center"
      }}
    >
      <IconButton data-drag-handle size="small" sx={{ cursor: "grab" }}>
        <IconGripVertical size={18} />
      </IconButton>
      <Typography> {srv?.categories?.name || "--"}</Typography>
    </TableCell>,
    <TableCell
      sx={{
        ...tableCellCommonStyling,
        textTransform: "capitalize",
      }}
    >
      {srv.name || "--"}
    </TableCell>,
    <TableCell
      key="timeslot"
      sx={{
        ...tableCellCommonStyling,
        textTransform: "capitalize",
      }}
    >
      {srv.duration_minutes || "--"}
    </TableCell>,

    <TableCell key="price" sx={{ ...tableCellCommonStyling }}>
      ${srv.price?.toFixed(2) || 0.0}
    </TableCell>,
    <TableCell key="actions" sx={{ ...tableCellCommonStyling }}>
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
      >
        {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/services")) ||
          (session?.user?.roles?.includes("BackOfficeUser") &&
            checkAccess(
              session.user.accessrights
                ?.controls as AccessRights2,
              "/admin/services",
              "edit"
            ))) && (
            <>
              <Tooltip title={t("edit", keys)}>
                <Fab
                  className="bg-background-paper text-blue-600"
                  size="small"
                  onClick={() => handleEdit(srv.id)}
                >
                  <IconEdit size={18} />
                </Fab>
              </Tooltip>
              <Tooltip
                title={
                  srv.active_status > 0
                    ? t("active", keys)
                    : t("inactive", keys)
                }
              >
                <Fab
                  size="small"
                  className={`bg-background-paper ${srv.active_status > 0
                    ? "text-green-600"
                    : "text-red-600"
                    }`}
                  onClick={() => {
                    statusHander(srv.id, srv.name);
                  }}
                >
                  <IconPower size={18} />
                </Fab>
              </Tooltip>
            </>
          )}

        {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/services")) ||
          (session?.user?.roles?.includes("BackOfficeUser") &&
            checkAccess(
              session.user.accessrights
                ?.controls as AccessRights2,
              "/admin/services",
              "delete"
            ))) && (<Tooltip title={t("delete", keys)}>
              <Fab
                size="small"
                className="bg-background-paper text-red-600"
                onClick={() => {
                  handleOpenDeleteDialog(
                    srv.id,
                    srv.name
                  );
                }}
              >
                <IconTrash size={18} />
              </Fab>
            </Tooltip>)}
      </Stack>
    </TableCell>
  ]
  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/services")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            session.user.accessrights
              ?.controls as AccessRights2,
            "/admin/services",
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
                      setSelectedFilters(initialFilters);
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
                  {(session?.user?.roles?.includes("Owner") ||
                    (session?.user?.roles?.includes("BackOfficeUser") &&
                      checkAccess(
                        session.user.accessrights?.controls as AccessRights2,
                        "/admin/services",
                        "add"
                      ))) && (
                      <Button
                        onClick={() => {
                          router.push({
                            pathname: "/admin/services/manage",
                            query: { action: "create" },
                          });
                        }}
                        className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium "
                        startIcon={<IconPlus className="text-[#2276FF]" />}
                      >
                        {t("add_services", keys)}
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
                                  <Box>
                                    {headCell === "category" && (
                                      <Select
                                        multiple
                                        value={selectedFilters.category}
                                        onChange={(e) =>
                                          handleTypeChange(e, "category")
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
                                          {t("choose_category", keys)}
                                        </MenuItem>
                                        {categories?.map((catg: any) => (
                                          <MenuItem
                                            key={catg.id}
                                            value={catg.id}
                                            sx={{ textTransform: "capitalize" }}
                                          >
                                            {catg.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    )}
                                  </Box>
                                </Box>
                              </div>
                            </Box>
                            <Box>
                              {headCell === "category" &&
                                selectedFilters.category.length > 0 && (
                                  <Stack
                                    direction="row"
                                    mt={1}
                                    gap={0.5}
                                    flexWrap="wrap"
                                  >
                                    {selectedFilters.category.map((fcatg) => {
                                      const category = categories.find(
                                        (catg: any) => catg.id === fcatg
                                      );
                                      return (
                                        <Chip
                                          key={fcatg}
                                          label={category ? category.name : fcatg}
                                          sx={{
                                            ...chipsCommonStyling,
                                            textTransform: "capitalize",
                                          }}
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
                                            handleDelete("category", fcatg)
                                          }
                                        />
                                      );
                                    })}
                                  </Stack>
                                )}
                            </Box>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <DndSortTable data={services} onDragEnd={handleReorder} renderRow={renderRow} />
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
                  ".MuiTablePagination-actions": { marginLeft: "auto !important" },
                  ".MuiTablePagination-spacer": { display: "none !important" },
                }}
              />
            </Box>

            <DeleteConfirmationDialog
              open={openDeleteDialog.isOpen}
              itemName={openDeleteDialog.itemName || ""}
              onConfirm={() => {
                deleteProduct();
              }}
              onCancel={() => {
                setOpenDeleteDialog({ isOpen: false, itemName: "" });
                setDeleteId(null);
              }}
            />
          </PageContainer>) : (<AccessDenied />)}
    </>
  );
};

export default ServiceListing;
