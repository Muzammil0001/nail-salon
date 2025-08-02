import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  TablePagination,
  Paper,
} from "@mui/material";
import {
  IconEdit,
  IconTrash,
  IconPower,
  IconReload,
  IconPlus,
} from "@tabler/icons-react";
import axios from "axios";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import PageContainer from "@/components/container/PageContainer";
import CustomSearch from "@/components/forms/theme-elements/CustomSearch";
import { t } from "../../../lib/translationHelper"
import { useSelector } from "@/store/Store";
import { useSession } from "next-auth/react";
import DeleteConfirmationDialog from "../../components/common/DeleteConfirmationDialog";
import { ToastErrorMessage } from "../common/ToastMessages";

interface TranslationLanguage {
  id: number;
  language_id: number;
  active_status: boolean;
  is_published: boolean;
  language: {
    language_name: string;
  };
}

export default function TranslationListing() {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<TranslationLanguage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState<{
    isOpen: boolean;
    itemName: string;
    itemId: number | null;
  }>({
    isOpen: false,
    itemName: "",
    itemId: null,
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "app_translations" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
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
        const response = await axios.post(
          "/api/app-translation/fetchtranslations",
          {
            search: searchTerm,
            page,
            rowsPerPage,
          }
        );
        setData(response.data.data);
        setCount(response.data.totalCount);
      } catch (error: any) {
        ToastErrorMessage(error)
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(debouncedSearch, page, rowsPerPage);
  }, [debouncedSearch, page, rowsPerPage, triggerSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearchHandler(value);
  };

  const updateActiveStatus = async (
    languageId: number,
    currentStatus: boolean
  ) => {
    try {
      setLoading(true);
      await axios.post("/api/app-translation/changestatus", {
        id: languageId,
        status: !currentStatus,
      });
      fetchData(debouncedSearch, page, rowsPerPage);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.post("/api/app-translation/deletetranslation", {
        id,
      });
      setOpenDeleteDialog({ isOpen: false, itemName: "", itemId: null });
      fetchData(debouncedSearch, page, rowsPerPage);
    } catch (error) {
      console.error("Error deleting language:", error);
    }
  };

  const handleEdit = (item: TranslationLanguage) => {
    router.push({
      pathname: "/admin/app-translation/manage",
      query: { action: "view", id: item.id },
    });
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

  return (
    <PageContainer
      css={{ padding: "0px" }}
      topbar={
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <CustomSearch value={search} onChange={handleSearchChange} />
            <IconButton
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                fetchData("", page, rowsPerPage);
              }}
              className="bg-white text-primary-main size-11 ms-1 hover:opacity-90 hover:bg-white"
            >
              <IconReload size={20} />
            </IconButton>
          </div>
          <Button
            onClick={() =>
              router.push({
                pathname: "/admin/app-translation/manage",
                query: { action: "create" },
              })
            }
            className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium me-1"
            startIcon={<IconPlus className="text-[#2276FF]" />}
          >
            {t("add_translation", keys)}
          </Button>
        </div>
      }
    >
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <TableContainer
          component={Paper}
          sx={{ minWidth: { xs: 320, sm: 500 }, margin: "auto" }}
        >
          <Table aria-label="custom pagination table">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    boxShadow:
                      "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    width: "50%",
                    fontWeight: "700",
                    fontSize: "16px"
                  }}
                >
                  {t("language", keys)}
                </TableCell>
                <TableCell
                  sx={{
                    boxShadow:
                      "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    width: "25%",
                    fontWeight: "700",
                    fontSize: "16px"
                  }}
                >
                  {t("status", keys)}
                </TableCell>
                <TableCell
                  className="text-center"
                  sx={{
                    boxShadow:
                      "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    width: "25%",
                    fontWeight: "700",
                    fontSize: "16px"
                  }}
                >
                  {t("action", keys)}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                    component="th"
                    scope="row"
                  >
                    {item.language.language_name}
                  </TableCell>
                  <TableCell
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      color: item.active_status ? "green" : "red",
                    }}
                  >
                    {item.active_status ? "Active" : "In-Active"}
                  </TableCell>

                  <TableCell
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                    className="text-center"
                  >
                    <Tooltip title={t("edit", keys)}>
                      <IconButton
                        size="small"
                        sx={{ marginRight: "8px", color: "#2276FF" }}
                        onClick={() => handleEdit(item)}
                      >
                        <IconEdit className="size-5" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("delete", keys)}>
                      <IconButton
                        size="small"
                        sx={{ marginRight: "8px", color: "#DA514E" }}
                        onClick={() =>
                          setOpenDeleteDialog({
                            isOpen: true,
                            itemName: item.language.language_name,
                            itemId: item.id,
                          })
                        }
                      >
                        <IconTrash className="size-5" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={item.active_status ? t("deactivate", keys) : t("activate", keys)}
                    >
                      <IconButton
                        size="small"
                        sx={{
                          marginRight: "8px",
                          color: item.active_status ? "#06B217" : "#DA514E",
                        }}
                        onClick={() =>
                          updateActiveStatus(item.id, item.active_status)
                        }
                      >
                        <IconPower className="size-5" />
                      </IconButton>
                    </Tooltip>
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

        <DeleteConfirmationDialog
          open={openDeleteDialog.isOpen}
          itemName={openDeleteDialog.itemName || ""}
          onConfirm={() => {
            if (openDeleteDialog.itemId) {
              handleDelete(openDeleteDialog.itemId);
            }
          }}
          onCancel={() =>
            setOpenDeleteDialog({ isOpen: false, itemName: "", itemId: null })
          }
        />
      </Box>
    </PageContainer>
  );
}
