import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Fab,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Loader from "../loader/Loader";
import PageContainer from "../container/PageContainer";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import DeleteConfirmationDialog from "../common/DeleteConfirmationDialog";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { t } from "../../../lib/translationHelper";
import { useSelector } from "@/store/Store";
interface AppVersion {
  app_name: { app_name: string };
  app_version_id: number;
  app_version_type: string;
  app_version_number: string;
  build_number: string;
  status: string;
  app_platform: string;
  app_version_build_number: number;
  id: number;
  app_version_live: boolean;
}

const AppVersionListing = () => {
  const router = useRouter();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  // State variables
  const [loading, setLoading] = useState(false);
  const [appVersions, setAppVersions] = useState<AppVersion[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<{
    isOpen: boolean;
    itemName: string;
  }>({ isOpen: false, itemName: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(false);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  useEffect(() => {
    fetchAppVersions();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "appversion" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const fetchAppVersions = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/appversions/getallversion", {
        rowsPerPage,
        page,
      });
      setAppVersions(response.data.appVersions);
      setCount(response.data.count);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppVersions();
  }, [refresh]);

  const handleDeleteAppVersion = async (id: number) => {
    if (id !== null) {
      setLoading(true);
      try {
        const response = await axios.post("/api/appversions/delete", { id });
        setRefresh((prev) => !prev);
        setOpenDeleteDialog({ isOpen: false, itemName: "" });
        setDeleteId(null);
        ToastSuccessMessage(response?.data?.message || "deleted!");
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateAppVersion = () => {
    router.push("/admin/appversions/manage?action=create");
  };

  const handleOpenDeleteDialog = (id: number, name: string) => {
    setDeleteId(id);
    setOpenDeleteDialog({ isOpen: true, itemName: name });
  };

  const handleEdit = async (id: number) => {
    router.push({
      pathname: "/admin/appversions/manage",
      query: {
        action: "view",
        id: id,
      },
    });
  };
  const comonTableCellStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
    textTransform: "capitalize",
  };
  const HEADERS = [
    "id",
    "application",
    "platform",
    "version_number",
    "build_number",
    "status",
    "action",
  ];
  return (
    <PageContainer
      css={{ padding: "0px" }}
      topbar={
        <div>
          <Stack direction="row" justifyContent="end" mb={2}>
            <Button
              variant="contained"
              onClick={handleCreateAppVersion}
              className="bg-white h-12 text-[#4D5963] hover:opacity-90 hover:bg-white hover:text-[#4D5963] font-medium  mr-1"
              startIcon={<IconPlus className="text-[#2276FF]" />}
            >
              {t("create_app_version", keys)}
            </Button>
          </Stack>
        </div>
      }
    >
      <Box mt={1}>
        <Loader loading={loading} />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {HEADERS.map((header, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      fontSize: "16px",
                      fontWeight: "700",
                      ...comonTableCellStyling,
                    }}
                    className={`font-bold ${
                      header === "action" ? "text-center" : ""
                    }`}
                  >
                    {t(header, keys)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {appVersions.map((version, index) => (
                <TableRow key={version.app_version_id}>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {version?.id}
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {version.app_name
                      ? version.app_name.app_name
                      : "Unknown App"}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...comonTableCellStyling,
                      textTransform: "uppercase",
                    }}
                  >
                    {version.app_platform}
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {version.app_version_number}
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {version.app_version_build_number}
                  </TableCell>
                  <TableCell sx={{ ...comonTableCellStyling }}>
                    {" "}
                    {version.app_version_live ? "Yes" : "No"}
                  </TableCell>
                  <TableCell
                    sx={{ ...comonTableCellStyling }}
                    className="text-center"
                  >
                    <Tooltip title={t("edit", keys)}>
                      <Fab
                        className="bg-background-paper text-primary-main"
                        size="small"
                        onClick={() => handleEdit(version.id)}
                      >
                        <IconEdit size={18} />
                      </Fab>
                    </Tooltip>
                    <Tooltip title={t("delete", keys)}>
                      <Fab
                        size="small"
                        className="bg-background-paper text-red-600"
                        onClick={() =>
                          handleOpenDeleteDialog(
                            version.id,
                            version.app_version_number
                          )
                        }
                      >
                        <IconTrash size={18} />
                      </Fab>
                    </Tooltip>
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
        <DeleteConfirmationDialog
          open={openDeleteDialog.isOpen}
          itemName={openDeleteDialog.itemName || ""}
          onConfirm={() => {
            if (deleteId !== null) {
              handleDeleteAppVersion(deleteId);
            }
          }}
          onCancel={() => setOpenDeleteDialog({ isOpen: false, itemName: "" })}
        />
      </Box>
    </PageContainer>
  );
};

export default AppVersionListing;
