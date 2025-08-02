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
} from "@mui/material";
import {
  IconCopy,
  IconEdit,
  IconPower,
  IconReload,
  IconTrash,
} from "@tabler/icons-react";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import * as yup from "yup";
import { useFormik } from "formik";
import axios from "axios";
import Loader from "@/components/loader/Loader";
import PageContainer from "@/components/container/PageContainer";
import CustomSearch from "@/components/forms/theme-elements/CustomSearch";
import DeleteConfirmationDialog from "@/components/common/DeleteConfirmationDialog";
import AddSubscriptionDialog from "./AddSubscriptionDialog";
import CustomFormLabel from "../forms/theme-elements/CustomFormLabel";
import CustomTextField from "../forms/theme-elements/CustomTextField";
import { ContentCopy } from "@mui/icons-material";
import { t } from "../../../lib/translationHelper"
import { useSelector } from "@/store/Store";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "../common/ToastMessages";
const headCells = ["name", "price", "yearly_price", "action"];

const SubscriptionListing = () => {
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [action, setAction] = useState("create");
  const [plans, setPlans] = useState<Record<string, any>[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Record<string, any>[]>([]);
  const [features, setFeatures] = useState<Record<string, any>[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [openCopyLink, setOpenCopyLink] = useState(false);
  const [monthlyLink, setMonthlyLink] = useState("");
  const [yearlyLink, setYearlyLink] = useState("");
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "subscriptions" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const validationSchema = yup.object({
    name: yup
      .string()
      .min(2, "too_short")
      .max(50, "too_long")
      .required("name_is_required")
      .test("name-exists", "name_already_exists", async (value, schema) => {
        try {
          const response = await axios.post("/api/subscription/verifyname", {
            name: value,
            id: schema.parent.id,
            action: action,
          });
          const isExist = response.data;
          return value && isExist;
        } catch (error) {
          ToastErrorMessage(error);
        }
      }),
    description: yup
      .string()
      .min(2, "too_short")
      .max(100, "too_long"),
    price: yup.number().required("price_is_required"),
    yearly_price: yup.number().required("yearly_price_is_required"),
    max_devices: yup.number().required("max_devices_is_required"),
    max_locations: yup.number().required("max_locations_is_required"),
    max_tables: yup.number().required("max_tables_is_required"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      price: 0,
      yearly_price: 0,
      max_devices: 0,
      max_tables: 0,
      max_locations: 0,
      subscription_feature: [],
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        let url = "/api/subscription/addsubscription";
        if (action === "view") url = "/api/subscription/updatesubscription";
        await axios.post(url, {
          ...values,
          action,
        });
        ToastSuccessMessage(
          action === "create"
            ? t("subscription_created_successfully", keys)
            : t("subscription_updated_successfully", keys)
        );
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        handleClose();
        setLoading(false);
        setRefresh((prev) => !prev);
      }
    },
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/subscription/getsubscriptions");
        setPlans(response.data);
        setFilteredPlans(response.data);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh, triggerSearch]);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/subscription/getfeatures");
        setFeatures(response.data.features);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEdit = async (row: any) => {
    setAction("view");
    formik.setValues(row);
    setOpen(true);
  };
  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
    setAction("create");
  };

  const handleOpenDeleteDialog = (row: any) => {
    setOpenDeleteDialog(row);
  };
  const changeStatus = async (row: any) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/subscription/changestatus", {
        id: row.id,
        status: !row.active_status,
      });
      ToastSuccessMessage(response?.data?.message || "status_updated!");
      setRefresh((prev) => !prev);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };
  const deletePlan = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/subscription/deletesubscription",
        {
          id: openDeleteDialog.id,
        }
      );
      ToastSuccessMessage(response?.data?.message || "deleted!");
      setRefresh((prev) => !prev);
      setOpenDeleteDialog(null);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: any) => {
    setSearch(e.target.value);
    if (e.target.value === "") {
      setFilteredPlans(plans);
    } else {
      setFilteredPlans(
        plans.filter((item) =>
          item.name.toLowerCase().includes(e.target.value.toLowerCase())
        )
      );
    }
  };
  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenCopyLink = async (id: number) => {
    setOpenCopyLink(true);
    setMonthlyLink(
      `https://admin.${process.env.NEXT_PUBLIC_URL}/signup?body=${Buffer.from(
        `billingModel=MONTHLY&subscriptionId=${id}`,
        "binary"
      ).toString("base64")}`
    );
    setYearlyLink(
      `https://admin.${process.env.NEXT_PUBLIC_URL}/signup?body=${Buffer.from(
        `billingModel=YEARLY&subscriptionId=${id}`,
        "binary"
      ).toString("base64")}`
    );
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        ToastSuccessMessage("link_copied_to_clipboard");
      })
      .catch((error) => {
        ToastErrorMessage(error);
      });
  };
  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
  };

  return (
    <PageContainer
      css={{ padding: "0px" }}
      topbar={
        <Box className="w-full flex justify-between items-center">
          <Loader loading={loading} />
          <Box className="flex gap-2 items-center">
            <CustomSearch
              value={search}
              onChange={handleSearch}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Button
              onClick={() => {
                setOpen(true);
              }}
              className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium "
              startIcon={<IconPlus className="text-[#2276FF]" />}
            >
              {t("add_subscription", keys)}
            </Button>
          </Box>
        </Box>
      }
    >
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
                {headCells.map((headCell, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      maxWidth: "100px",
                      textAlign: headCell === "action" ? "center" : "left",
                      verticalAlign: "top",
                      fontWeight: "700",
                      fontSize: "16px",
                      ...tableCellCommonStyling,
                    }}
                  >
                    {t(headCell, keys)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(search
                ? filteredPlans
                : rowsPerPage > 0
                  ? filteredPlans.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                  )
                  : filteredPlans
              )?.map((row: any, index: number) => {
                return (
                  <TableRow key={index}>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      {row.name}
                    </TableCell>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      {row.price}
                    </TableCell>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      {row.yearly_price}
                    </TableCell>
                    <TableCell sx={{ ...tableCellCommonStyling }}>
                      <Stack
                        direction="row"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Tooltip title={t("plan_link", keys)}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              handleOpenCopyLink(row.id);
                            }}
                          >
                            <IconCopy  className="bg-background-paper text-blue-600" size="1.1rem" />
                          </IconButton>
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
                        <Tooltip
                          title={t(row.active_status ? "active" : "inactive", keys)}
                        >
                          <Fab
                            size="small"
                            className={`bg-background-paper ${row.active_status
                                ? "text-green-600"
                                : "text-red-600"
                              }`}
                            onClick={() => {
                              changeStatus(row);
                            }}
                          >
                            <IconPower size={18} />
                          </Fab>
                        </Tooltip>
                        <Tooltip title={t("delete", keys)}>
                          <Fab
                            size="small"
                            className="bg-background-paper text-red-600"
                            onClick={() => {
                              handleOpenDeleteDialog(row);
                            }}
                          >
                            <IconTrash size={18} />
                          </Fab>
                        </Tooltip>
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
          count={filteredPlans.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            ".MuiTablePagination-actions": { marginLeft: "auto !important" },
            ".MuiTablePagination-spacer": { display: "none !important" },
          }}
        />
        {openDeleteDialog?.id && (
          <DeleteConfirmationDialog
            open={openDeleteDialog?.id}
            itemName={openDeleteDialog.name}
            onConfirm={deletePlan}
            onCancel={() => setOpenDeleteDialog(null)}
          />
        )}

        {open && (
          <AddSubscriptionDialog
            open={open}
            features={features}
            action={action}
            formik={formik}
            handleClose={handleClose}
          />
        )}
      </Box>

      <Dialog open={openCopyLink} fullWidth={true} maxWidth={"md"}
        BackdropProps={{
          style: {
            backdropFilter: "blur(5px)",
          },
        }}
      >
        <DialogTitle>
          {t("please_find_below_links_for_this_subscription", keys)}
        </DialogTitle>
        <DialogContent>
          <Box>
            <CustomFormLabel htmlFor="monthly-link">
              {t("monthly_link", keys)}
            </CustomFormLabel>
            <Box className="flex gap-2">
              <CustomTextField
                id="monthly-link"
                fullWidth={true}
                value={monthlyLink}
                disabled={true}
              />
              <IconButton
                onClick={() => {
                  handleCopyLink(monthlyLink);
                }}
                edge="end"
              >
                <ContentCopy />
              </IconButton>
            </Box>
          </Box>
          <Box>
            <CustomFormLabel htmlFor="yearly-link">
              {t("yearly_link", keys)}
            </CustomFormLabel>
            <Box className="flex gap-2">
              <CustomTextField
                id="yearly-link"
                fullWidth={true}
                value={yearlyLink}
                disabled={true}
              />
              <IconButton
                onClick={() => {
                  handleCopyLink(yearlyLink);
                }}
                edge="end"
              >
                <ContentCopy />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent={"center"}
          padding={2}
          gap={2}
        >
          <Button onClick={() => setOpenCopyLink(false)} variant="contained">
            {t("ok", keys)}
          </Button>
        </Box>
      </Dialog>
    </PageContainer>
  );
};

export default SubscriptionListing;
