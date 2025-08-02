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
  Dialog,
  DialogTitle,
  DialogActions,
  IconButton,
  InputAdornment,
  DialogContent,
  debounce,
} from "@mui/material";
import CustomTextField from "../forms/theme-elements/CustomTextField";
import { IconEdit, IconCopy, IconLockOpen, IconPower, IconReload } from "@tabler/icons-react";
import { IconPlus } from "@tabler/icons-react";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageContainer from "../container/PageContainer";
import Loader from "../loader/Loader";
import { useRouter } from "next/router";
import CustomSearch from "../forms/theme-elements/CustomSearch";
import { useSession } from "next-auth/react";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { t } from "../../../lib/translationHelper";
import { useSelector } from "@/store/Store";
const HEADERS = ["name", "location_number", "address", "actions"];

const SitesListing = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const { data: session }: any = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refresh, setRefresh] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [count, setCount] = useState(0);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [otp, setOtp] = useState<any>();
  const [openPassword, setOpenPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "locations_overview" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

useEffect(() => {
  if (
    session &&
    !session?.user?.roles.includes("SuperAdmin")
  ) {
    router.push("/admin/login");
  }
}, [session]);

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
      pathname: "/admin/sites/manage",
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
        fetchLocations(value);
      }, 300),
    []
  );

  const fetchLocations = useCallback(
    async (searchTerm = search) => {
      try {
        setLoading(true);
        const response = await axios.post("/api/sites/getlocations", {
          rowsPerPage,
          page,
          search: searchTerm,
          company_id: session?.user.selected_company_id,
        });
        setLocations(response.data.locations);
        setCount(response.data.count);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
    [
      refresh,
      rowsPerPage,
      page,
      triggerSearch,
    ]
  );

  useEffect(() => {
    fetchLocations();
  }, [
    refresh,
    rowsPerPage,
    page,
    triggerSearch,
    session?.user.selected_company_id,
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const deleteClient = async () => {
    try {
      setLoading(true);
      setOpenDeleteDialog(false);
      const response = await axios.post("/api/sites/deletelocation", {
        id: locationId,
      });
      if (response.status === 200) {
        ToastSuccessMessage(
          t(response?.data?.message, keys) ||
          t("deleted_location_successfully", keys)
        );
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
    }
  };

  const handleOneTimePassword = async (id: number) => {
    try {
      const response = await axios.post("/api/clients/onetimepassword", {
        id: id,
      });
      setOtp(response.data);
      setOpenPassword(true);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  const locationStatus = async (id: number) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/sites/statuslocation", {
        id: id,
      });
      if (response.status === 200) {
        ToastSuccessMessage(
          t(response?.data?.message, keys) || t("status_updated!", keys)
        );
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageContainer
        css={{ padding: "0px !important" }}
        topbar={
          <>
            <Box className="w-full flex justify-between items-center">
              <Box className="flex gap-2 items-center">
                <CustomSearch
                  value={search}
                  onChange={handleSearchChange}
                  onSearchClick={() => debouncedSearch(search)}
                  placeholder={t("search", keys)}
                  onClearClick={() => {
                    if (search) {
                      setSearch("");
                      setTriggerSearch((prev) => !prev);
                    }
                  }}
                />
              </Box>

              <Button
                onClick={() =>
                  router.push({
                    pathname: "/admin/sites/manage",
                    query: { action: "create" },
                  })
                }
                className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium mr-1"
                startIcon={<IconPlus className="text-dark" />}
              >
                {t("add_sites", keys)}
              </Button>
            </Box>
          </>
        }
      >
        <Loader loading={loading} />
        <Box>
          <Dialog open={openDeleteDialog}>
            <DialogTitle>
              {t("are_you_sure_you_want_to_delete_this_location", keys)}?
            </DialogTitle>
            <DialogActions>
              <Button
                mx-8
                onClick={() => {
                  deleteClient();
                }}
                variant="contained"
              >
                {t("yes", keys)}
              </Button>
              <Button
                mx-8
                onClick={() => {
                  setOpenDeleteDialog(false);
                }}
                variant="contained"
              >
                {t("no", keys)}
              </Button>
            </DialogActions>
          </Dialog>
          <TableContainer>
            <Table aria-labelledby="tableTitle">
              <TableHead>
                <TableRow>
                  {HEADERS.map((headCell, index) => (
                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                      key={index}
                      style={{
                        textAlign: headCell === "actions" ? "center" : "left",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        fontSize={16}
                      >
                        {t(headCell, keys)}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {locations?.map((row: any, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell
                        sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                          textTransform: "capitalize",
                          fontSize: "16px",
                        }}
                      >
                        {row.location_name}
                      </TableCell>
                      <TableCell
                        sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                          fontSize: "16px",
                        }}
                      >
                        {row.location_number}
                      </TableCell>
                      <TableCell
                        sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                          fontSize: "16px",
                          textTransform: "capitalize"
                        }}
                      >
                        {`${row.street}, ${row?.city}, ${row?.state}, ${row?.country}`}
                      </TableCell>
                      <TableCell
                        sx={{
                          boxShadow:
                            "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                          fontSize: "16px",
                        }}
                        style={{ textAlign: "center" }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          alignItems="center"
                        >
                           <Tooltip title={t("create_one_time_password", keys)}>
                        <Fab
                          className="bg-background-paper text-blue-600"
                          size="small"
                          onClick={() => handleOneTimePassword(row.id)}
                        >
                          <IconLockOpen size={18} />
                        </Fab>
                      </Tooltip>
                          <Tooltip title={t("edit", keys)}>
                            <Fab
                              className="bg-background-paper text-blue-600"
                              size="small"
                              onClick={() => handleEdit(row)}
                              disabled={row.active_status ? false : true}
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
                              onClick={() => locationStatus(row.id)}
                            >
                              <IconPower size={18} />
                            </Fab>
                          </Tooltip>
                          {/* <Tooltip title={t("delete", keys)}>
              <Fab
                size="small"
                className="bg-background-paper text-red-600"
                onClick={() => {
                  setLocationId(row.id);
                  setOpenDeleteDialog(true);
                }}
              >
                <IconTrash size={18} />
              </Fab>
            </Tooltip> */}
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
        <Dialog open={openPassword} maxWidth="sm" fullWidth={true}>
        <DialogTitle>{t("one_time_password", keys)}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <CustomTextField
            id="otp_user"
            placeholder={t("otp_username", keys) ?? ""}
            variant="outlined"
            fullWidth
            label={t("otp_username", keys)}
            value={otp?.username || ""}
            sx={{
              mt: 2,
              mb: 0,
              fontWeight: "bold",
              "& input": {
                fontSize: "1.3rem",
              },
            }}
            disabled={true}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconCopy
                    className="hover:cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(otp?.username || "");
                      ToastSuccessMessage("copied");
                    }}
                  ></IconCopy>
                </InputAdornment>
              ),
            }}
          />
          <CustomTextField
            id="otp"
            placeholder={`${t("one_time_password", keys)}`}
            variant="outlined"
            fullWidth
            label={t("one_time_password", keys)}
            value={otp?.password || ""}
            sx={{
              mt: 2,
              mb: 0,
              fontWeight: "bold",
              "& input": {
                fontSize: "1.3rem",
              },
            }}
            disabled={true}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconCopy
                    className="hover:cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(otp?.password || "");
                      ToastSuccessMessage("copied");
                    }}
                  ></IconCopy>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ pb: 3, pr: 3 }}>
          <Button onClick={() => setOpenPassword(false)} variant="contained">
            {t("close", keys)}
          </Button>
        </DialogActions>
      </Dialog>
      </PageContainer>
    </>
  );
};

export default SitesListing;
