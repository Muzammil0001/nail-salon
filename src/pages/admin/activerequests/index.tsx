import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  IconButton,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconReload, IconX } from "@tabler/icons-react";
import axios from "axios";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { debounce } from "lodash";
import { ThumbsUp } from "lucide-react";
import PageContainer from "@/components/container/PageContainer";
import Loader from "@/components/loader/Loader";
import CustomSearch from "@/components/forms/theme-elements/CustomSearch";
import Alert from "@/components/alert/Alert";
import { checkAccess } from "../../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "@/components/common/ToastMessages";
import { useDispatch, useSelector } from "@/store/Store";
import { t } from "../../../../lib/translationHelper";
import { setHasNotify } from "@/store/NotifySlice";
const headCells = [
  "message",
  "table_name",
  "waiter_name",
  "date&time",
  "action",
];

interface ActiveRequest {
  id: number;
  message: string;
  table_id: number;
  table_name: string;
  created_at: string;
  waiter_id: number;
  active_status: boolean;
}

interface AlertInterface {
  open: boolean;
  title: string;
  description: string;
  callback: () => void;
}

const ActiveRequest: React.FC = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const dispatch = useDispatch();
  const { data: session }: any = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [alert, setAlert] = useState<AlertInterface | null>(null);
  const [messages, setMessages] = useState<ActiveRequest[]>([]);
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<ActiveRequest[]>([]);
  const hasNotify = useSelector((state) => state.notify.hasNotify);
  const [filters, setFilters] = useState({
    active_status: [] as string[],
  });
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "active_request" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
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

  const debouncedSearch = useMemo(
    () =>
      debounce(async (value: string) => {
        try {
          setLoading(true);
          const response = await axios.post(
            "/api/activerequest/fetchactiverequest",
            {
              rowsPerPage,
              page: 0,
              search: value,
            }
          );
          setMessages(response.data.services);
          setCount(response.data.count);
        } catch (error) {
          ToastErrorMessage(error);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/activerequest/fetchactiverequest",
        {
          rowsPerPage,
          page,
          search,
        }
      );
      setFilteredMessages(response.data.requests);
      setCount(response.data.count);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [refresh, rowsPerPage, page, triggerSearch, hasNotify]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    let filtered = Array.isArray(messages) ? [...messages] : [];
    if (filters.active_status.length > 0) {
      filtered = filtered.filter((message) =>
        filters.active_status.includes(
          message.active_status ? "active" : "inactive"
        )
      );
    }
    setFilteredMessages(filtered);
  }, [filters.active_status, messages]);

  const changeStatus = async (id: number, active_status: boolean) => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/activerequest/changeactivestatus",
        {
          id,
          active_status,
        }
      );
      ToastSuccessMessage(
        t(response?.data?.message, keys) || t("status_updated!", keys)
      );
      fetchMessages();
      dispatch(setHasNotify(false));
      setTimeout(() => dispatch(setHasNotify(true)), 0);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ["active", "inactive"];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/\//g, ".")
      .replace(",", "");
  };
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/activerequests")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <PageContainer
      css={{ padding: "0px" }}
      topbar={
        <Box className="w-full flex justify-between items-center">
          <Box className="flex gap-2 items-center">
            <CustomSearch
              value={search}
              onChange={handleSearchChange}
              onSearchClick={() => debouncedSearch(search)}
              placeholder={t("search", keys)}
            />
            <IconButton
              onClick={() => {
                if (search) {
                  setSearch("");
                  setTriggerSearch((prev) => !prev);
                }
              }}
              className="bg-white text-primary-main size-11 ms-1 hover:opacity-90 hover:bg-white"
            >
              <IconReload size={20} />
            </IconButton>
          </Box>
          <div className="flex items-center gap-2"></div>
        </Box>
      }
    >
      <Loader loading={loading} />
      <Alert alert={alert} />
      <Box>
        <TableContainer>
          <Table aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                {headCells.map((headCell, index) => (
                  <TableCell
                    key={index}
                    align={headCell === "message" ? "left" : "center"}
                    className="font-bold"
                    sx={{
                      boxShadow:
                        "rgba(74, 32, 32, 0.04) 7px 0 10px inset !important",
                      fontWeight: "bold",
                    }}
                  >
                    <div
                      className={`flex items-center ${
                        headCell === "message"
                          ? "justify-start"
                          : "justify-center"
                      }`}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {t(headCell, keys)}
                      </Typography>
                      {headCell === "active_status" && (
                        <Box>
                          <FormControl fullWidth size="small">
                            <Select
                              multiple
                              value={filters.active_status}
                              renderValue={() => null}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  active_status: e.target.value as string[],
                                }))
                              }
                              sx={{
                                boxShadow: "none",
                                width: "40px",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "transparent",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "transparent",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "transparent",
                                },
                              }}
                            >
                              {statuses?.map((status) => (
                                <MenuItem key={status} value={status}>
                                  {t(status, keys)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    </div>
                    {headCell === "active_status" && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {filters.active_status.map((value) => (
                          <Chip
                            key={value}
                            label={t(value, keys)}
                            onDelete={() => {
                              setFilters((prev) => ({
                                ...prev,
                                active_status: prev.active_status.filter(
                                  (status) => status !== value
                                ),
                              }));
                            }}
                            deleteIcon={
                              <IconX className="h-4 w-4" color="#2276FF" />
                            }
                            sx={{
                              color: "#2276FF",
                              minWidth: "73px",
                              backgroundColor: "transparent",
                              height: "25px",
                              borderRadius: "3px",
                              border: "1px solid #2276FF",
                              opacity: 1,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMessages?.map((row: ActiveRequest) => (
                <TableRow key={row.id}>
                  <TableCell
                    align="left"
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                  >
                    {row.message}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                  >
                    {row.table_name}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                  >
                    {row.waiter_id}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                  >
                    {formatDate(row.created_at)}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                    }}
                  >
                    {(session?.user?.roles?.includes("Owner") ||
                      (session?.user?.roles?.includes("BackOfficeUser") &&
                        checkAccess(
                          session.user.accessrights?.controls as AccessRights2,
                          "/admin/activerequests",
                          "edit"
                        ))) && (
                      <Tooltip title={t("status", keys)}>
                        <IconButton
                          className={
                            row.active_status
                              ? "text-[#06B217]"
                              : "text-[#ef4444]"
                          }
                          size="small"
                          onClick={() => {
                            changeStatus(row.id as number, !row.active_status);
                          }}
                        >
                          <ThumbsUp size={18} />
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
    </PageContainer>
  );
};

export default ActiveRequest;
