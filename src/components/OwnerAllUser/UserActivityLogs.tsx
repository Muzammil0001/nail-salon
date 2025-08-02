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
  IconPlus,
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

const UserActivityLogs = () => {
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
 

  const [openActivityDialog, setOpenActivityDialog] = useState(false);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const [activityRowsPerPage, setActivityRowsPerPage] = useState(25);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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

  const handleActivityPageChange = (event: unknown, newPage: number) => {
    setActivityPage(newPage);
  };

  const handleActivityRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setActivityRowsPerPage(parseInt(event.target.value, 10));
    setActivityPage(0);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.post("/api/alluser/getalluser", {
        rowsPerPage,
        page,
        search,
        timeZone,
      });
      setData(response.data.users);

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

  const fetchActivityData = useCallback(
    async (userId: number) => {
      try {
        setLoading(true);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await axios.post(`/api/alluser/activity`, {
          userId,
          fetchAll: false,
          search: "",
          rowsPerPage: activityRowsPerPage,
          page: activityPage,
          timeZone,
        });
        setActivityData(response.data.activities);
        setActivityCount(response.data.count);
        setOpenActivityDialog(true);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
    [activityRowsPerPage, activityPage]
  );

  useEffect(() => {
    if (selectedUserId !== null) {
      fetchActivityData(selectedUserId);
    }
  }, [selectedUserId, activityPage, activityRowsPerPage]);

  const handleActivityClick = (userId: number) => {
    setSelectedUserId(userId);
  };

  const HEADERS = [
    "name",
    "username",
    "email",
    "type",
    "created",
    "activity",
    "last_login",
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
            />
            <IconButton
              onClick={() => {
                if (search) {
                  setSearch("");
                  setTriggerSearch((prev) => !prev);
                }
                setRefresh((prev) => !prev);
              }}
              className="bg-white text-primary-main size-11 ms-1 hover:opacity-90 hover:bg-white"
            >
              <IconReload size={20} />
            </IconButton>
          </Box>
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
                    {row.name}
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
                    {row.roles.join(", ")}
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {row.created}
                  </TableCell>
                  <TableCell
                    sx={{ ...comonTableCellStyling }}
                    className="text-[#c1bfbf]"
                  >
                    <IconActivity
                      onClick={() => handleActivityClick(row.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {" "}
                    {row.lastLogin}
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip
                        title={
                          row.active_status
                            ? t("inactive", keys)
                            : t("active", keys)
                        }
                      >
                        <Fab
                          size="small"
                          onClick={() =>
                            toggleActiveStatus(row.id, row.active_status)
                          }
                          className={`bg-background-paper ${
                            row.active_status
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          <IconPower className="size-5" />
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

      <Dialog
        open={openActivityDialog}
        onClose={() => setOpenActivityDialog(false)}
        sx={{
          "& .MuiDialog-paper": {
            width: "80%",
            maxWidth: "none",
          },
        }}
        BackdropProps={{
          style: {
            backdropFilter: "blur(5px)",
          },
        }}
      >
        <DialogTitle className="text-center">
          {t("activity_details", keys)}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table aria-labelledby="tableTitle">
              <TableHead>
                <TableRow>
                  {["no", "description", "created"].map((header, idx) => (
                    <TableCell
                      key={idx}
                      sx={{
                        ...comonTableCellStyling,
                        fontWeight: "700",
                        fontSize: "16px",
                      }}
                    >
                      {t(header, keys)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {activityData?.map((activity: any, index) => (
                  <TableRow key={activity.id}>
                    <TableCell sx={{ ...comonTableCellStyling }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ ...comonTableCellStyling }}>
                      {activity.message}
                    </TableCell>
                    <TableCell sx={{ ...comonTableCellStyling }}>
                      {activity.created_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[25, 50, 75, 100, 150, 200, 500]}
            component="div"
            labelRowsPerPage={t("rows_per_page", keys)}
            count={activityCount}
            rowsPerPage={activityRowsPerPage}
            page={activityPage}
            onPageChange={handleActivityPageChange}
            onRowsPerPageChange={handleActivityRowsPerPageChange}
            sx={{
              ".MuiTablePagination-actions": { marginLeft: "auto !important" },
              ".MuiTablePagination-spacer": { display: "none !important" },
            }}
          />
        </DialogContent>
        <DialogActions>
          <CustomFormButton
            variant="outlined"
            onClick={() => setOpenActivityDialog(false)}
            color="primary"
          >
            {t("close", keys)}
          </CustomFormButton>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default UserActivityLogs;
