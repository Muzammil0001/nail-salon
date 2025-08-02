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
import { useSession } from "next-auth/react";
import DeleteConfirmationDialog from "../../components/common/DeleteConfirmationDialog";
import { Search } from "@mui/icons-material";
import { checkAccess } from "../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import { t } from "../../../lib/translationHelper";
import { toast } from "sonner";
import { ToastErrorMessage } from "../common/ToastMessages";
import { useSelector } from "@/store/Store";

interface ClientLanguage {
  language_id: number;
  active_status: boolean;
  is_published: boolean;
  languages: {
    language_name: string;
  };
}

export default function TranslationList() {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const router = useRouter();
  const { data: session }: any = useSession();
  const [data, setData] = useState<ClientLanguage[]>([]);
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
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "translation" }
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
        const response = await axios.post("/api/translation/alltranslation", {
          search: searchTerm,
          page,
          rowsPerPage,
        });
        setData(response.data.data);
        setCount(response.data.totalCount);
      } catch (error) {
        console.error("Error fetching translations:", error);
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
      await axios.post("/api/translation/activestatus", {
        language_id: languageId,
        active_status: !currentStatus,
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
      console.log(id);
      await axios.post("/api/translation/delete", { language_id: id });
      setOpenDeleteDialog({ isOpen: false, itemName: "", itemId: null });
      fetchData(debouncedSearch, page, rowsPerPage);
    } catch (error) {
      console.error("Error deleting language:", error);
    }
  };

  const handleEdit = (item: ClientLanguage) => {
    router.push({
      pathname: "/admin/translation/manage",
      query: { action: "view", id: item.language_id },
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
            <CustomSearch
              value={search}
              placeholder={t("search", keys)}
              onChange={handleSearchChange}
            />
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

          {(session?.user?.roles?.includes("Owner") ||
            (session?.user?.roles?.includes("BackOfficeUser") &&
              checkAccess(
                session.user.accessrights?.controls as AccessRights2,
                "/admin/translation",
                "add"
              ))) && (
            <Button
              onClick={() =>
                router.push({
                  pathname: "/admin/translation/manage",
                  query: { action: "create" },
                })
              }
              className="bg-white text-primary-main hover:text-primary-main hover:bg-gray-200"
              startIcon={<IconPlus />}
            >
              {t("add_translation", keys)}
            </Button>
          )}
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
                    width: "33%",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {t("language", keys)}
                </TableCell>
                <TableCell
                  sx={{
                    boxShadow:
                      "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    width: "33%",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {t("status", keys)}
                </TableCell>
                <TableCell
                  className="text-center"
                  sx={{
                    boxShadow:
                      "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    width: "33%",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {t("action", keys)}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.language_id}>
                  <TableCell
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                    component="th"
                    scope="row"
                  >
                    {item.languages.language_name}
                  </TableCell>
                  <TableCell
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      color:
                        item.active_status && item.is_published
                          ? "green"
                          : !item.active_status && !item.is_published
                          ? "#DA514E"
                          : !item.active_status && item.is_published
                          ? "#DA514E"
                          : "#f4bf0e",
                    }}
                  >
                    {item.active_status && item.is_published
                      ? "Active"
                      : !item.active_status && !item.is_published
                      ? "Deactivate"
                      : !item.active_status && item.is_published
                      ? "Deactivate"
                      : "Pending"}
                  </TableCell>

                  <TableCell
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                    className="text-center"
                  >
                    {(session?.user?.roles?.includes("Owner") ||
                      (session?.user?.roles?.includes("BackOfficeUser") &&
                        checkAccess(
                          session.user.accessrights?.controls as AccessRights2,
                          "/translation",
                          "edit"
                        ))) && (
                      <>
                        <Tooltip title={t("edit", keys)}>
                          <IconButton
                            sx={{ marginRight: "8px", color: "#2276FF" }}
                            onClick={() => handleEdit(item)}
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title={
                            item.active_status
                              ? t("deactivate", keys)
                              : t("activate", keys)
                          }
                        >
                          <IconButton
                            sx={{
                              marginRight: "8px",
                              color: item.active_status ? "#06B217" : "#DA514E",
                            }}
                            onClick={() =>
                              updateActiveStatus(
                                item.language_id,
                                item.active_status
                              )
                            }
                          >
                            <IconPower size={18} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {(session?.user?.roles?.includes("Owner") ||
                      (session?.user?.roles?.includes("BackOfficeUser") &&
                        checkAccess(
                          session.user.accessrights?.controls as AccessRights2,
                          "/translation",
                          "delete"
                        ))) && (
                      <Tooltip title={t("delete", keys)}>
                        <IconButton
                          sx={{ marginRight: "8px", color: "#DA514E" }}
                          onClick={() =>
                            setOpenDeleteDialog({
                              isOpen: true,
                              itemName: item.languages.language_name,
                              itemId: item.language_id,
                            })
                          }
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
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
