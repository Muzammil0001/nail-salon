import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Button,
  Stack,
  Tooltip,
  Fab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  IconPower,
  IconLockOpen,
  IconEdit,
  IconPlus,
  IconX,
  IconReload,
  IconActivity,
} from "@tabler/icons-react";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import Alert from "../alert/Alert";
import CustomFormButton from "../forms/theme-elements/CustomFormButton";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { t } from "../../../lib/translationHelper";
import { useSelector } from "@/store/Store";
import moment from "moment";

const UserListing = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (row: Record<string, any>) => {
    router.push({
      pathname: "/admin/users/manage",
      query: { action: "view", id: row.id },
    });
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.post("/api/clients/fetchclients", {
        rowsPerPage,
        page,
        search,
        timeZone,
      });
      setData(response.data.clients);
      setCount(response.data.count);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  }, [rowsPerPage, page, search, triggerSearch]);

  useEffect(() => {
    fetchUsers();
  }, [refresh, rowsPerPage, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debounce(() => fetchUsers(), 300)();
  };

  const toggleActiveStatus = async (id: number, currentStatus: boolean) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/alluser/togglestatus", {
        userId: id,
        status: !currentStatus,
      });
      setRefresh((prev) => !prev);
      ToastSuccessMessage(response.data.message || "status_updated!");
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const HEADERS = [
    "name",
    "username",
    "email",
    "created",
    "action",
  ];
  const comonTableCellStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
    textTransform: "capitalize",
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "AllUser" }
        );
        setKeys(response.data);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  return (
    <PageContainer
      css={{ padding: "0px" }}
      topbar={
        <Box className="w-full flex justify-between items-center">
          <Box className="flex gap-2 items-center">
            <CustomSearch
              value={search}
            onChange={handleSearchChange}
              placeholder={t("search", keys)}
              onClearClick={() => {
                setSearch("");
                setTriggerSearch((prev) => !prev);
                setRefresh((prev) => !prev);
              }}
            />
          </Box>

          {/* <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                router.push({
                  pathname: "/admin/clients/manage",
                  query: { action: "create" },
                })
              }
              className="bg-white h-12 rounded-full text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium "
              startIcon={<IconPlus className="text-dark" />}
            >
              {t("add_client", keys)}
            </Button>

          </div> */}
        </Box>
      }
    >
      <Loader loading={loading} />
      <Alert alert={null} />
      <Box>
        <TableContainer>
          <Table aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                {HEADERS.map((header, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      ...comonTableCellStyling,
                      fontWeight: "700",
                      fontSize: "16px",
                      textAlign: header === "action" ? "center" : "left",
                    }}
                  >
                    {t(header, keys)}
                  </TableCell>
                ))}
              </TableRow>{" "}
            </TableHead>
            <TableBody>
              {data?.map((row: any, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {`${row.first_name} ${row.last_name}`}
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {row.username}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...comonTableCellStyling,
                      textTransform: "lowercase",
                    }}
                  >
                    {row.email}
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {moment(row.created_at).format("DD.MM.YYYY")}
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
                      <Tooltip title={t("edit", keys)}>
                        <Fab
                          className="bg-background-paper text-blue-600"
                          size="small"
                          onClick={() => handleEdit(row)}
                        >
                          <IconEdit size={18} />
                        </Fab>
                      </Tooltip>
                      <Tooltip title={t("status", keys)}>
                        <Fab
                          size="small"
                          className={`bg-background-paper ${row.active_status === true
                            ? "text-green-600"
                            : "text-red-600"
                            }`}
                          onClick={() =>
                            toggleActiveStatus(row.id, row.active_status)
                          }
                        >
                          <IconPower size={18} />
                        </Fab>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 75, 100, 150, 200, 500]}
          component="div"
          count={count}
          labelRowsPerPage={t("rows_per_page", keys)}
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

export default UserListing;
