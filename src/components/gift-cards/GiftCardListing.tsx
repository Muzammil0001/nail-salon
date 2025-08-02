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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import {
  IconEdit,
  IconPlus,
  IconReload,
  IconTrash,
  IconEye,
  IconPower,
} from "@tabler/icons-react";
import axios from "axios";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import { useSelector } from "@/store/Store";

import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import DeleteConfirmationDialog from "../common/DeleteConfirmationDialog";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { t } from "../../../lib/translationHelper";
import { checkAccess } from "../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import GiftCardModal from "./GiftCardModal";
import AccessDenied from "../NoAccessPage";

const HEADERS = ["name", "card_code", "amount", "number_of_times", "times_used", "remaining_uses", "expiry_date", "status", "actions"];

interface GiftCard {
  id: string;
  card_code: string;
  name: string;
  description?: string;
  amount: number;
  number_of_times: number;
  times_used: number;
  is_percentage: boolean;
  expiry_date?: string;
  active_status: boolean;
  created_at: string;
  location: {
    location_name: string;
  };
  created_by_user: {
    first_name: string;
    last_name: string;
  };
}

const GiftCardListing = () => {
  const { data: session }: any = useSession();
  const router = useRouter();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<any>(null);
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined as boolean | undefined,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view");
  const [modalGiftCard, setModalGiftCard] = useState<GiftCard | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "gift_cards" }
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

  const fetchGiftCards = useCallback(
    async (searchTerm = search) => {
      try {
        setLoading(true);
        const response = await axios.post("/api/gift-cards/fetchgiftcards", {
          rowsPerPage,
          page,
          search: searchTerm,
          filters,
        });
        setGiftCards(response.data.giftCards);
        setCount(response.data.count);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
    [refresh, rowsPerPage, page, triggerSearch, filters]
  );

  useEffect(() => {
    fetchGiftCards();
  }, [refresh, rowsPerPage, page, triggerSearch, filters]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(0);
        fetchGiftCards(value);
      }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleCreate = () => {
    setModalMode("create");
    setModalGiftCard(null);
    setModalOpen(true);
  };

  const handleEdit = (giftCard: GiftCard) => {
    setModalMode("edit");
    setModalGiftCard(giftCard);
    setModalOpen(true);
  };

  const handleView = async (giftCard: GiftCard) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/gift-cards/getgiftcard", {
        id: giftCard.id,
      });
      setModalGiftCard(response.data.giftCard);
      setModalMode("view");
      setModalOpen(true);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (giftCard: GiftCard) => {
    setOpenDeleteDialog(giftCard);
  };

  const deleteGiftCard = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/gift-cards/deletegiftcard", {
        id: openDeleteDialog.id,
      });
      ToastSuccessMessage(response?.data?.message || "deleted!");
      setRefresh((prev) => !prev);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
      setOpenDeleteDialog(null);
    }
  };

  const toggleStatus = async (giftCard: GiftCard) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/gift-cards/updategiftcard", {
        id: giftCard.id,
        name: giftCard.name,
        description: giftCard.description,
        amount: giftCard.amount,
        number_of_times: giftCard.number_of_times,
        is_percentage: giftCard.is_percentage,
        gift_code: giftCard.card_code,
        active_status: !giftCard.active_status,
      });
      ToastSuccessMessage(response?.data?.message || "status_updated!");
      setRefresh((prev) => !prev);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAmount = (amount: number, isPercentage: boolean) => {
    if (isPercentage) {
      return `${amount.toFixed(2)}%`;
    } else {
      return formatCurrency(amount);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: boolean) => {
    return status ? "success" : "error";
  };

  const getStatusText = (status: boolean) => {
    return status ? "active" : "inactive";
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleDelete = async (giftCard: any) => {
    if (window.confirm(t("delete_gift_card_confirmation", keys))) {
      try {
        setLoading(true);
        const response = await fetch(`/api/gift-cards/deletegiftcard`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: giftCard.id }),
        });

        if (response.ok) {
          ToastSuccessMessage(t("gift_card_deleted_successfully", keys));
          fetchGiftCards();
        } else {
          const error = await response.json();
          ToastErrorMessage(error.message || t("error_deleting_gift_card", keys));
        }
      } catch (error) {
        console.error("Error deleting gift card:", error);
        ToastErrorMessage(t("error_deleting_gift_card", keys));
      } finally {
        setLoading(false);
      }
    }
  };

  const columns = [
    {
      field: "name",
      headerName: t("name", keys),
      flex: 1,
      minWidth: 200,
    },
    {
      field: "card_code",
      headerName: t("card_code", keys),
      flex: 1,
      minWidth: 120,
    },
    {
      field: "amount",
      headerName: t("amount", keys),
      flex: 1,
      minWidth: 120,
      renderCell: (params: any) => (
        <Typography variant="body2" fontWeight="medium">
          {formatAmount(params.row.amount, params.row.is_percentage)}
        </Typography>
      ),
    },

    {
      field: "number_of_times",
      headerName: t("number_of_times", keys),
      flex: 1,
      minWidth: 120,
    },
    {
      field: "times_used",
      headerName: t("times_used", keys),
      flex: 1,
      minWidth: 120,
    },
    {
      field: "remaining_uses",
      headerName: t("remaining_uses", keys),
      flex: 1,
      minWidth: 120,
      renderCell: (params: any) => {
        const remaining = params.row.number_of_times - params.row.times_used;
        return (
          <Typography variant="body2" fontWeight="medium" color={remaining <= 0 ? "error" : "success"}>
            {remaining}
          </Typography>
        );
      },
    },
    {
      field: "expiry_date",
      headerName: t("expiry_date", keys),
      flex: 1,
      minWidth: 120,
      renderCell: (params: any) => (
        <Typography variant="body2">
          {params.value ? formatDate(params.value) : "-"}
        </Typography>
      ),
    },
    {
      field: "active_status",
      headerName: t("status", keys),
      flex: 1,
      minWidth: 100,
      renderCell: (params: any) => (
        <Chip
          label={params.value ? t("active", keys) : t("inactive", keys)}
          color={params.value ? "success" : "error"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: t("actions", keys),
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: (params: any) => (
        <Box display="flex" gap={1}>
          <IconButton
            size="small"
            onClick={() => handleView(params.row)}
            color="primary"
          >
            <IconEye size={16} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
            color="primary"
          >
            <IconEdit size={16} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row)}
            color="error"
          >
            <IconTrash size={16} />
          </IconButton>
        </Box>
      ),
    },
  ];

  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
  };

  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/benefits/gift-cards")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            (session.user as any).accessrights
              ?.controls as AccessRights2,
            "/admin/benefits/gift-cards",
            "view"
          ))) ? (<PageContainer
            css={{ padding: "0px" }}
            topbar={
              <Box className="w-full flex justify-between items-center">
                <Box className="flex gap-2 items-center">
                  <CustomSearch
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={t("search", keys)}
                    onClearClick={() => {
                      if (search) {
                        setSearch("");
                        setTriggerSearch((prev) => !prev);
                      }
                    }}
                  />
                </Box>
                <div className="flex items-center gap-2">
                  {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/benefits/gift-cards")) ||
                    (session?.user?.roles?.includes("SuperAdmin") && session.user.navigation?.includes("/admin/benefits/gift-cards")) ||
                    (session?.user?.roles?.includes("BackOfficeUser") &&
                      checkAccess(
                        session.user.accessrights?.controls as AccessRights2,
                        "/admin/benefits/gift-cards",
                        "add"
                      ))) && (
                      <Button
                        onClick={handleCreate}
                        className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium"
                        startIcon={<IconPlus className="text-[#2276FF]" />}
                      >
                        {t("add_gift_card", keys)}
                      </Button>
                    )}
                </div>
              </Box>
            }
          >
            <Loader loading={loading} />

            <Box className="bg-white rounded-lg shadow-sm">
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {HEADERS.map((headCell, index) => (
                        <TableCell sx={{ ...tableCellCommonStyling, textAlign: headCell === "actions" ? "center" : "left" }}
                          key={index}
                          className="font-semibold text-[#4D5963] border-b border-gray-200 text-base"
                        >
                          {t(headCell as string, keys)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {giftCards?.map((giftCard, index) => (
                      <TableRow key={giftCard.id} className="hover:bg-gray-50">
                        <TableCell sx={{ ...tableCellCommonStyling }} className="border-b border-gray-100">
                          <Typography variant="body2" className="font-medium">
                            {giftCard.name}
                          </Typography>
                          {giftCard.description && (
                            <Typography variant="caption" className="text-gray-500">
                              {giftCard.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ ...tableCellCommonStyling }} className="border-b border-gray-100">
                          <Typography variant="body2" className="font-medium">
                            {giftCard.card_code}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...tableCellCommonStyling }} className="border-b border-gray-100">
                          <Typography variant="body2" className="font-medium">
                            {formatAmount(giftCard.amount, giftCard.is_percentage)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...tableCellCommonStyling }} className="border-b border-gray-100">
                          <Typography variant="body2" className="font-medium">
                            {giftCard.number_of_times}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...tableCellCommonStyling }} className="border-b border-gray-100">
                          <Typography variant="body2" className="font-medium">
                            {giftCard.times_used}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...tableCellCommonStyling }} className="border-b border-gray-100">
                          <Typography variant="body2" className="font-medium">
                            {giftCard.number_of_times - giftCard.times_used}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...tableCellCommonStyling }} className="border-b border-gray-100">
                          <Typography variant="body2">
                            {formatDate(giftCard.expiry_date)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...tableCellCommonStyling }} className="border-b border-gray-100">
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={t(getStatusText(giftCard.active_status), keys)}
                              color={getStatusColor(giftCard.active_status) as any}
                              size="small"
                            />
                            {isExpired(giftCard.expiry_date) && (
                              <Chip
                                label={t("expired", keys)}
                                color="error"
                                size="small"
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ ...tableCellCommonStyling, display: "flex", justifyContent: "center" }} className="border-b border-gray-100">
                          <Stack direction="row" spacing={1}>
                            <Tooltip title={t("view", keys)}>
                              <Fab
                                size="small"
                                className="bg-background-paper"
                                onClick={() => handleView(giftCard)}
                              >
                                <IconEye className="text-blue-600" size={18} />
                              </Fab>
                            </Tooltip>

                            {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/benefits/gift-cards")) ||
                             (session?.user?.roles?.includes("SuperAdmin") && session.user.navigation?.includes("/admin/benefits/gift-cards")) ||
                              (session?.user?.roles?.includes("BackOfficeUser") &&
                                checkAccess(
                                  session.user.accessrights?.controls as AccessRights2,
                                  "/admin/benefits/gift-cards",
                                  "edit"
                                ))) && (
                                <>
                                  <Tooltip title={t("edit", keys)}>
                                    <Fab
                                      size="small"
                                      className="bg-background-paper"
                                      onClick={() => handleEdit(giftCard)}
                                    >
                                      <IconEdit className="text-blue-600" size={18} />
                                    </Fab>
                                  </Tooltip>

                                  <Tooltip title={t("status", keys)}>
                                    <Fab
                                      size="small"
                                      className="bg-background-paper"
                                      onClick={() => toggleStatus(giftCard)}
                                    >
                                      <IconPower
                                        className={giftCard.active_status ? "text-green-600" : "text-red-600"}
                                        size={18}
                                      />
                                    </Fab>
                                  </Tooltip>
                                </>
                              )}

                            {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/benefits/gift-cards")) ||
                              (session?.user?.roles?.includes("SuperAdmin") && session.user.navigation?.includes("/admin/benefits/gift-cards")) ||
                              (session?.user?.roles?.includes("BackOfficeUser") &&
                                checkAccess(
                                  session.user.accessrights?.controls as AccessRights2,
                                  "/admin/benefits/gift-cards",
                                  "delete"
                                ))) && (
                                <Tooltip title={t("delete", keys)}>
                                  <Fab
                                    size="small"
                                    className="bg-background-paper text-red-600"
                                    onClick={() => handleOpenDeleteDialog(giftCard)}
                                  >
                                    <IconTrash size={18} />
                                  </Fab>
                                </Tooltip>
                              )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
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
            </Box>

            <GiftCardModal
              open={modalOpen}
              onClose={() => { setModalOpen(false); fetchGiftCards(); }}
              mode={modalMode}
              giftCard={modalGiftCard}
              onSuccess={() => setRefresh((prev) => !prev)}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
              open={!!openDeleteDialog}
              onCancel={() => setOpenDeleteDialog(null)}
              onConfirm={deleteGiftCard}
              itemName={openDeleteDialog?.name}
            />
          </PageContainer>) : (<AccessDenied />)}
    </>
  );
};

export default GiftCardListing; 