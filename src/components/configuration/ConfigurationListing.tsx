import PageContainer from "../../components/container/PageContainer";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  Box,
  Button,
  debounce,
  Dialog,
  DialogActions,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import Loader from "../../components/loader/Loader";
import axios from "axios";
import { IconPlus, IconReload } from "@tabler/icons-react";
import EnvDialog from "../../components/env/EnvDialog";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { IconTrash } from "@tabler/icons-react";
import { IconEdit } from "@tabler/icons-react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useSelector } from "@/store/Store";
import {t} from "../../../lib/translationHelper";
import CustomSearch from "@/components/forms/theme-elements/CustomSearch";
import DeleteConfirmationDialog from "@/components/common/DeleteConfirmationDialog";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";

const Envconf = () => {
  const { data: session, status }: any = useSession({
    required: true,
    // onUnauthenticated() {
    // 	push('/admin/login');
    // },
  });
  const { push } = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const [envvaribales, setEnvvariables] = useState<Record<string, any>[]>([]);
  const [refresh, setRefresh] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editEnv, setEditEnv] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [count, setCount] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<{
    isOpen: boolean;
    itemName: string;
  }>({ isOpen: false, itemName: "" });
  const [deleteId, setDeleteId] = useState<number>();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "configurations" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const fetchAllergen = useCallback(
    async (searchTerm = search) => {
      try {
        setLoading(true);
        const response = await axios.post("/api/env/fetchenv", {
          rowsPerPage,
          page,
          search: searchTerm,
        });
        setEnvvariables(response?.data.configurations);
        setCount(response.data.count);
        //   setFilteredAllergen(response.data.allergens);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
    [rowsPerPage, page]
  );

  useEffect(() => {
    fetchAllergen();
  }, [refresh, rowsPerPage, page, triggerSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(0);
        fetchAllergen(value);
      }, 300),
    []
  );

  const deleteEnv = async (id: number) => {
    try {
      setLoading(true);
      const reponse= await axios.post("/api/env/deleteenv", {
        id: id,
      });
      ToastSuccessMessage(reponse?.data?.message || "deleted!");
      setRefresh((prev) => !prev);
      setOpenDeleteDialog({ isOpen: false, itemName: "" });
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (id: number, itemName: string) => {
    setOpenDeleteDialog({ isOpen: true, itemName: `${itemName}` });
    setDeleteId(id);
  };

  const [envData, setEnvData] = useState<Record<string, any>>({
    key: "",
    value: "",
    description: "",
    is_visible: true,
    is_editable: true,
  });

  const [loading, setLoading] = useState(false);
  const validationSchema = yup.object({
    key: yup
      .string()
      .min(2, "too_short")
      .max(70, "too_long")
      .required("key_is_required")
      .test("env-key-exists", "key_already_exists", async (value) => {
        try {
          if (open) {
            let action = "new";
            if (isEdit) {
              action = "edit";
            }
            const response = await axios.post("/api/env/verifykey", {
              id: formik.values?.id,
              action,
              key: value,
            });
            const isExist = response.data;
            return value && isExist;
          }
        } catch (error) {
          ToastErrorMessage(error);
        }
      }),
    value: yup
      .string()
      .min(1, "too_short")
      .max(15000, "too_long")
      .required("value_is_required"),
  });

  const handleClose = () => {
    formik.setValues({
      key: "",
      value: "",
      description: "",
      is_visible: true,
      is_editable: true,
    });
    formik.setErrors({});
    formik.setTouched({});
    setIsEdit(false);
    setOpen(false);
  };
  const formik: any = useFormik({
    initialValues: envData,
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      let url = "/api/env/create";
      if (isEdit) {
        url = "/api/env/updateenv";
      }
      try {
        setLoading(true);
        const response = await axios.post(url, { ...values, id: values?.id });
        ToastSuccessMessage(
          response?.data?.message || isEdit ? "updated!" : "created!"
        );
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
        setRefresh((prev) => !prev);
        handleClose();
      }
    },
  });
  const HEADERS = [
    { label: "id", width: "10%" },
    { label: "key", width: "15%" },
    { label: "value", width: "15%" },
    {
      label: "description",
      width: "30%",
      className: "break-words",
      style: { whiteSpace: "normal" },
    },
    { label: "action", width: "20%", className: "text-center" },
  ];
  const router = useRouter();
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/configuration")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <PageContainer
      css={{ padding: "0px" }}
      topbar={
        <div className="w-full flex justify-between items-center">
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpen(true)}
            startIcon={<IconPlus width={18} />}
            className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium "
          >
            {t("add_configuration", keys)}
          </Button>
        </div>
      }
    >
      <Stack>
        <EnvDialog
          open={open}
          setOpen={setOpen}
          isEdit={isEdit}
          setIsEdit={setIsEdit}
          formik={formik}
          loading={loading}
        />
        <Loader loading={loading} />
        <Box sx={{ overflowX: { xs: "scroll", lg: "hidden" } }}>
          <Dialog open={openDeleteDialog.isOpen}>
            <DialogTitle>
              {t("are_you_sure_you_want_to_delete_this_client", keys)}?
            </DialogTitle>
            <DialogActions>
              <Button mx-8 variant="contained">
                {t("yes", keys)}
              </Button>
              <Button
                mx-8
                onClick={() =>
                  setOpenDeleteDialog({ isOpen: false, itemName: "" })
                }
                variant="contained"
              >
                {t("no", keys)}
              </Button>
            </DialogActions>
          </Dialog>
          <Table
            sx={{
              width: "100%",
              borderCollapse: "separate",
              paddingInline: "0px",
            }}
          >
            <TableHead>
              <TableRow>
                {HEADERS.map(({ label, width, className, style }, idx) => (
                  <TableCell
                    key={idx}
                    className={`w-[${width}] ${className || ""}`}
                    sx={{
                      boxShadow:
                        "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      ...style,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="700"
                      sx={{ fontSize: "16px" }}
                    >
                      {t(label, keys)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0 ? envvaribales.slice() : envvaribales)?.map(
                (data, index) => (
                  <TableRow hover key={data.id}>
                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      <Typography
                        sx={{
                          width: "100%",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                        variant="subtitle1"
                      >
                        {data.id}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      <Typography variant="subtitle2">{data.key}</Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      <Typography variant="subtitle2">
                        {!data.is_visible ? (
                          "**********"
                        ) : data?.value?.length >= 40 ? (
                          <Tooltip title={data?.value}>
                            <Typography>
                              {data?.value.slice(0, 35) + " ..."}
                            </Typography>
                          </Tooltip>
                        ) : (
                          data?.value
                        )}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "400px",
                        }}
                      >
                        {data?.description}
                      </Typography>
                    </TableCell>
                    <TableCell
                      className="text-center"
                      sx={{
                        boxShadow:
                          "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
                      }}
                    >
                      <IconButton
                        disabled={!data.is_editable}
                        onClick={() => {
                          setOpen(true);
                          formik.setValues(data);
                          setIsEdit(true);
                          setEditEnv(data);
                        }}
                      >
                        <IconEdit
                          className="bg-background-paper text-primary-main"
                          size="18"
                        />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          handleOpenDeleteDialog(data.id, data.key);
                        }}
                      >
                        <IconTrash
                          className="bg-background-paper text-red-600"
                          size="18"
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
            <TableFooter>
              <TableRow></TableRow>
            </TableFooter>
          </Table>
        </Box>
      </Stack>

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

      <DeleteConfirmationDialog
        open={openDeleteDialog.isOpen}
        itemName={openDeleteDialog.itemName || ""}
        onConfirm={() => {
          !!deleteId && deleteEnv(deleteId);
        }}
        onCancel={() => setOpenDeleteDialog({ isOpen: false, itemName: "" })}
      />
    </PageContainer>
  );
};

export default Envconf;
// export async function getServerSideProps(context : any) {
//   const session : any = await getServerSession(context.req, context.res, options);
//   // Assuming `session.user.companies` is an array
//   if (session?.user?.companies?.length > 0) {
//     session.user.companies = session.user.companies.map((company : any) => ({
//       ...company,
//       created_at: company.created_at.toISOString(), // Convert to ISO string
//       updated_at: company.updated_at.toISOString(), // Convert to ISO string
//     }));
//   }

//   return {
//     props: {
//       session,
//     },
//   };
// }
