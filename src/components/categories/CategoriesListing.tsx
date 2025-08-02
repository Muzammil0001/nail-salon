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
  Select,
  Chip,
  IconButton,
  Menu,
} from "@mui/material";
import {
  IconEdit,
  IconPower,
  IconTrash,
  IconReload,
} from "@tabler/icons-react";
import DndSortableTable from "../DndSortTable";
import { IconGripVertical } from "@tabler/icons-react";
import { IconPlus } from "@tabler/icons-react";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import { useRouter } from "next/router";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { SelectChangeEvent } from "@mui/material/Select";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { Clear as RemoveIcon } from "@mui/icons-material";
import DeleteConfirmationDialog from "../common/DeleteConfirmationDialog";
import { Check } from "@mui/icons-material";
import AccessDenied from "../NoAccessPage";
import { debounce } from "lodash";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { checkAccess } from "../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import { useSelector } from "@/store/Store";
import { t } from "../../../lib/translationHelper";

interface SelectedFilters {
  orderType: string[];
  productionUnit: string[];
  taxType: string[];
  section: string[];
}
const initialFilters = {
  section: [],
  orderType: [],
  productionUnit: [],
  taxType: [],
};

const HEADERS = ["name", "image", "description", "action"];

const CategoriesListing = () => {
  const { data: session }: any = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [category_id, set_category_id] = useState<number | null>(null);
  const [categories, setCategories] = useState<any>([]);
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [isColumnSelection, setIsColumnSelection] = useState<boolean>(false);
  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [taxes, setTaxes] = useState([]);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [productionUnits, setProductionUnits] = useState([]);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(
    initialFilters
  );
  const [openDeleteDialog, setOpenDeleteDialog] = useState({
    isOpen: false,
    itemName: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "category" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleEdit = async (id: number) => {
    router.push({
      pathname: "/admin/categories/manage",
      query: {
        action: "view",
        id,
      },
    });
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(0);
        fetchCategories(value);
      }, 300),
    []
  );

  const fetchCategories = useCallback(
    async (searchTerm = search) => {
      try {
        setLoading(true);
        const response = await axios.post("/api/category/fetchcategories", {
          rowsPerPage,
          page,
          search: searchTerm,
        });


        setCategories(response.data.data);
        setCount(response.data.count);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [
      rowsPerPage,
      page,
      session?.user.selected_location_id,
      search,
      selectedFilters,
    ]
  );

  useEffect(() => {
    fetchCategories();
  }, [refresh, rowsPerPage, page, triggerSearch, selectedFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const deleteCategory = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/category/deletecategory", {
        category_id,
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
      const response = await axios.post("/api/category/categorystatus", {
        category_id: id,
      });
      if (response.status === 200) {
        ToastSuccessMessage(response?.data?.message || "status_updated!");
        fetchCategories();
      }
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDownloadAnchorEl(null);
    setIsColumnSelection(false);
    setSelectedColumns([]);
  };
  const handleDownloadClick = async (downloadFormat: string) => {
    try {
      const updatedColumns = HEADERS.filter((col) =>
        selectedColumns.includes(col) && col !== "action"
      );

      const rows = categories?.map((item: any) => {
        const row: any = {};
        updatedColumns.forEach((col: string) => {
          switch (col) {
            case "name":
              row[col] = item.name;
              break;
            case "description":
              row[col] = item.description;
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
          filename: `${t("categories_report", keys)}`,
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
      a.download = `${t("categories_report", keys)}.${fileExtension}`;
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
  const handleOpenDeleteDialog = (id: number, itemName: string) => {
    setOpenDeleteDialog({ isOpen: true, itemName: `${itemName} Category` });
    set_category_id(id);
  };
  const handleRemoveClick = () => {
    setIsColumnSelection(false);
    setDownloadTriggered(false);
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

  const handleReorder = async (newList: any[]) => {
    setCategories(newList);

    const payload = {
      categories: newList?.map((c, i) => ({
        id: c.id,
        sort_order: i,
      })),
    };
    try {
      const response = await axios.post("/api/category/reorder", payload);
      // ToastSuccessMessage(response?.data?.message || "Reorder success!");
      setRefresh((prev) =>!prev);
    } catch (error) {
      ToastErrorMessage(error);
      console.error("Failed to reorder categories:", error);
    }
  };


  const renderRow = (catg: any) => [
    <TableCell
      key="name"
      sx={{
        ...tableCellCommonStyling,
        textTransform: "capitalize",
        display:"flex", gap:2, alignItems:"center"
      }}
    >
       <IconButton data-drag-handle size="small" sx={{ cursor: "grab" }}>
        <IconGripVertical size={18} />
      </IconButton>
      <Typography>{catg.name}</Typography>
    </TableCell>,
    <TableCell key="desc" sx={{ ...tableCellCommonStyling }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          className="size-[30px]"
          src={
            catg?.image
              ? `${process.env.NEXT_PUBLIC_IMG_DIR}${catg.image}`
              : "/images/svgs/broken-image.svg"
          }
        />
      </Box>
    </TableCell>,
    <TableCell
    key="actions"
      sx={{
        ...tableCellCommonStyling,
        textTransform: "capitalize",
      }}
    >
      {catg.description}
    </TableCell>,


    <TableCell sx={{ ...tableCellCommonStyling }}>
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
      >
        {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/categories")) ||
          (session?.user?.roles?.includes("BackOfficeUser") &&
            checkAccess(
              session.user.accessrights
                ?.controls as AccessRights2,
              "/admin/categories",
              "edit"
            ))) && (
            <>
              <Tooltip title={t("edit", keys)}>
                <Fab
                  className="bg-background-paper text-blue-600"
                  size="small"
                  onClick={() => handleEdit(catg.id)}
                >
                  <IconEdit size={18} />
                </Fab>
              </Tooltip>
              <Tooltip
                title={
                  catg.active_status > 0
                    ? t("active", keys)
                    : t("inactive", keys)
                }
              >
                <Fab
                  size="small"
                  className={`bg-background-paper ${catg.active_status > 0
                    ? "text-green-600"
                    : "text-red-600"
                    }`}
                  onClick={() => {
                    statusHander(catg.id, catg.name);
                  }}
                >
                  <IconPower size={18} />
                </Fab>
              </Tooltip>
            </>
          )}

        {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/categories")) ||
          (session?.user?.roles?.includes("BackOfficeUser") &&
            checkAccess(
              session.user.accessrights
                ?.controls as AccessRights2,
              "/admin/categories",
              "delete"
            ))) && (
            <Tooltip title={t("delete", keys)}>
              <Fab
                size="small"
                className="bg-background-paper text-red-600"
                onClick={() => {
                  handleOpenDeleteDialog(catg.id, catg.name);
                }}
              >
                <IconTrash size={18} />
              </Fab>
            </Tooltip>
          )}
      </Stack>
    </TableCell>
  ]
  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/categories")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            session.user.accessrights
              ?.controls as AccessRights2,
            "/admin/categories",
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
                    onClear={() => {
                      setIsColumnSelection(false);
                      setDownloadAnchorEl(null);
                      setSelectedColumns([]);
                      setSelectedFilters(initialFilters);
                      if (search) {
                        setSearch("");
                        setTriggerSearch((prev) => !prev);
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/categories")) ||
                    (session?.user?.roles?.includes("BackOfficeUser") &&
                      checkAccess(
                        session.user.accessrights?.controls as AccessRights2,
                        "/admin/categories",
                        "add"
                      ))) && (
                      <Button
                        onClick={() => {
                          router.push({
                            pathname: "/admin/categories/manage",
                            query: { action: "create" },
                          });
                        }}
                        className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium "
                        startIcon={<IconPlus className="text-[#2276FF]" />}
                      >
                        {t("add_category", keys)}
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
                            maxWidth: "130px",
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
                  <DndSortableTable data={categories} onDragEnd={handleReorder} renderRow={renderRow} />
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
            </Box>
            <DeleteConfirmationDialog
              open={openDeleteDialog.isOpen}
              itemName={openDeleteDialog.itemName || ""}
              onConfirm={() => {
                deleteCategory();
              }}
              onCancel={() => setOpenDeleteDialog({ isOpen: false, itemName: "" })}
            />
          </PageContainer>) : (<AccessDenied />)}
    </>
  );
};

export default CategoriesListing;




