import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import CustomTextField from "../forms/theme-elements/CustomTextField";
import PageContainer from "@/components/container/PageContainer";
import axios from "axios";
import router from "next/router";
import { InputAdornment, Menu, MenuItem, Table, Typography, Box, TableHead, TableBody, TableRow, TableCell, Button, TableContainer } from "@mui/material";
import { ToastSuccessMessage, ToastErrorMessage } from "@/components/common/ToastMessages";
import Loader from "@/components/loader/Loader";
import { useSelector } from "@/store/Store";
import { t } from "../../../lib/translationHelper";
import UpdateIcon from '@mui/icons-material/Update';
import PayrollHistoryDialog from "./PayrollHistoryDialog";
import { printViaUSB } from "../../../lib/printViaUSB";
import moment from "moment";
import AccessDenied from "../NoAccessPage";
import { AccessRights2 } from "@/types/admin/types";
import { checkAccess } from "../../../lib/clientExtras";
interface PayrollPayment {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  worked_hours: number;
  per_hour_salary: number;
  commission: number;
  tip_deduction: number;
  gross_salary: number;
  net_salary: number;
  paid_at: string;
}
interface User {
  id: string;
  payroll_payment?: PayrollPayment[];
  first_name: string;
  last_name: string;
  user_to_role?: {
    role?: {
      name?: string;
    };
  }[];
}

interface PayrollEntry {
  salary: number | string;
  hours: number | string;
  commission: number | string;
  total: number | string;
  per_hour_salary: number | string;
  tip_deduction: number | string;
  payroll_payment?: PayrollPayment[];
}

interface FormValues {
  users: PayrollEntry[];
}

const HEADERS = ["username", "role", "salary", "hours", "tip_deduction", "commission", "total", "action"];

const PayrollManagement = ({ session }: any) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState<PayrollPayment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [payAllAnchorEl, setPayAllAnchorEl] = useState<null | HTMLElement>(null);

  const handlePayOptionsClick = (
    event: React.MouseEvent<HTMLElement>,
    userId: string
  ) => {
    setSelectedUserId(userId);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handlePrintSalarySelect = async (
    option: "daily" | "weeekly",
    userId: string,
    index: number
  ) => {
    const response = await axios.post("/api/payroll/fetchuserpay", { user_id: userId, option })
    await printViaUSB({
      data: response?.data?.data,
      printType: "salary_receipt",
    });
    fetchPayrolls();
    handleClose();
  };

  const handlePayOptionSelect = (
    option: "keep" | "reset",
    userId: string,
    index: number
  ) => {
    handlePay(userId, index, option);
    handleClose();
  };

  const handlePay = async (userId: string, index: number, option: "keep" | "reset") => {
    if (!option) return ToastErrorMessage("Please select a pay option first.");

    try {
      setLoading(true);
      const payload = {
        user_id: userId,
        pay_option: option,
      };
      const res = await axios.post("/api/payroll/payindividual", payload);
      ToastSuccessMessage(res?.data?.message);

      const savedPay = res?.data?.savedPay;

      const printableData = savedPay
        ? [
          {
            date: moment(savedPay.paid_at).format("DD-MM-YY"),
            staff_name: savedPay?.staff_name || "Staff",
            tip: savedPay.total_tip ?? savedPay.tip_deduction ?? 0,
            salary: savedPay.net_salary ?? 0,
          },
        ]
        : [];

      await printViaUSB({
        data: printableData,
        printType: "salary_receipt",
      });
      fetchPayrolls();
    } catch (err) {
      ToastErrorMessage(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayAllClick = (event: React.MouseEvent<HTMLElement>) => {
    setPayAllAnchorEl(event.currentTarget);
  };

  const handlePayAllClose = () => {
    setPayAllAnchorEl(null);
  };

  const handlePayAllOptionSelect = (option: "keep" | "reset") => {
    handlePayAll(option);
    handlePayAllClose();
  };

  const handlePayAll = async (option: "keep" | "reset") => {
    if (!option || (option !== "keep" && option !== "reset")) return;

    try {
      setLoading(true);

      const payload = formik.values.users.map((entry, index) => ({
        user_id: users[index].id,
        salary: entry.salary || 0,
        hours: entry.hours,
        commission: entry.commission || 0,
        tip_deduction: entry.tip_deduction || 0,
      }));

      const res = await axios.post("/api/payroll/payall", {
        payload,
        pay_option: option,
      });

      ToastSuccessMessage(res?.data?.message);

      const printableData = res?.data?.paidSalaries?.map((entry: any) => ({
        date: moment(entry.paid_at).format("DD-MM-YY"),
        staff_name: entry.staff_name || "Staff",
        tip: entry.total_tip ?? entry.tip_deduction ?? 0,
        salary: entry.net_salary ?? 0,
      })) || [];

      if (printableData.length > 0) {
        await printViaUSB({
          data: printableData,
          printType: "salary_receipt",
        });
      }

      fetchPayrolls();
    } catch (err) {
      ToastErrorMessage(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const response = await axios.post("/api/app-translation/fetchbypagename", { page_name: "payroll" });
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      }finally {
        setLoading(false)
      }
    })();
  }, [languageUpdate]);

  const fetchStaff = async () => {
    try {
      const response = await axios.post("/api/users/fetchusers", { fetchAll: true });
      if (response.status === 200) {
        setUsers(response.data?.users);
      }
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  useEffect(() => {
    if (!session?.user?.navigation?.includes("/admin/payroll")) {
      router.push("/admin/login");
    }
    fetchStaff();
  }, [session]);

  const formik = useFormik<FormValues>({
    initialValues: { users: [] },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      users: Yup.array().of(
        Yup.object().shape({
          salary: Yup.number()
            .typeError(t("must_be_a_number", keys))
            .min(0, t("amount_must_be_non_negative", keys))
            .required(t("amount_is_required", keys)),
          hours: Yup.number()
            .typeError(t("must_be_a_number", keys))
            .min(0, t("hours_must_be_non_negative", keys))
            .required(t("hours_are_required", keys)),
          tip_deduction: Yup.number()
            .typeError(t("must_be_a_number", keys))
            .min(0, t("amount_must_be_non_negative", keys))
            .max(100, t("tip_must_be_less_than_100", keys))
            .required(t("tip_deduction_is_required", keys)),
          commission: Yup.number()
            .typeError(t("must_be_a_number", keys))
            .min(0, t("amount_must_be_non_negative", keys))
            .notRequired(),
        })
      ),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = values.users.map((entry, index) => ({
          ...entry,
          user_id: users[index].id,
        }));
        const response = await axios.post("/api/payroll/savepayrolls", { payload });
        if (response.status === 200)
          ToastSuccessMessage(response.data.message || "saved!");
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchPayrolls = async () => {
    try {
      const response = await axios.post("/api/payroll/fetchpayrolls", {});
      if (response.status === 200) {
        const payrollData: PayrollEntry[] = response.data?.payrolls;

        const payrollMap = new Map<string | number, PayrollEntry>(
          payrollData.map((entry: any) => [entry.user_id, entry])
        );

        const usersPayroll: PayrollEntry[] = users.map((user) => {
          const matchedPayroll = payrollMap.get(user.id);
          user.payroll_payment = matchedPayroll?.payroll_payment;

          return {
            ...user,
            salary: matchedPayroll?.salary?.toString() ?? "",
            hours: matchedPayroll?.hours?.toString() ?? "",
            tip_deduction: matchedPayroll?.tip_deduction?.toString() ?? "",
            commission: matchedPayroll?.commission?.toString() ?? "",
            total: matchedPayroll?.total?.toString() ?? "0.00",
            per_hour_salary: (Number(matchedPayroll?.salary) / Number(matchedPayroll?.hours))?.toString() ?? "0.00",
          };
        });

        formik.setValues({ users: usersPayroll });
      }
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  useEffect(() => {
    if (users?.length > 0) { fetchPayrolls(); }
  }, [users]);

  useEffect(() => {
    const updatedUsers = formik.values.users.map((entry) => {
      const salary = parseFloat(entry.salary as string) || 0;
      const other = parseFloat(entry.commission as string) || 0;
      const hours = parseFloat(entry.hours as string) || 0;
      const total = (salary * hours).toFixed(2);
      const per_hour_salary = (salary / hours).toFixed(2);
      return {
        ...entry,
        total,
        per_hour_salary,
      };
    });
    formik.setFieldValue("users", updatedUsers, false);
  }, [formik.values.users.map((u) => `${u.salary}-${u.hours}-${u.commission}`).join(",")]);


  const tableCellCommonStyling = {
    boxShadow: "rgba(0, 0, 0, 0.04) 7px 0 10px inset !important",
    textTransform: "capitalize",
    textAlign: "center"
  };

  return (
    <>
      {((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/payroll")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            (session.user as any).accessrights
              ?.controls as AccessRights2,
            "/admin/payroll",
            "view"
          ))) ? (<form onSubmit={formik.handleSubmit}>
            <PageContainer topbar={<div></div>}>
              <Loader loading={loading} />

              <TableContainer className="rounded-lg border">
                <Table sx={{ width: "100%", borderCollapse: "separate" }} aria-labelledby="tableTitle">
                  <TableHead sx={{ height: "70px" }}>
                    <TableRow sx={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "white" }}>
                      {HEADERS.map((header) => (
                        <TableCell
                          sx={{
                            maxWidth: "130px",
                            fontSize: "16px",
                            fontWeight: "700",
                            ...tableCellCommonStyling,
                            padding: "10px",
                          }}
                          key={header}
                        >
                          {t(header, keys)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users?.length > 0 ? (
                      users.map((user, index) => (
                        <TableRow key={user.id}>
                          <TableCell sx={{ ...tableCellCommonStyling, fontWeight: "600" }}>
                            {`${user.first_name} ${user.last_name}`}
                          </TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            {user.user_to_role?.[0]?.role?.name || "-"}
                          </TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            <CustomTextField
                              name={`users[${index}].salary`}
                              placeholder={t("salary", keys)}
                              inputProps={{ min: 0 }}
                              value={formik.values.users?.[index]?.salary || ""}
                              onChange={formik.handleChange}
                              sx={{ minWidth: "120px" }}
                              onBlur={formik.handleBlur}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">$</InputAdornment>,
                              }}
                              error={
                                !!(formik.errors.users?.[index] as any)?.salary &&
                                !!formik.touched.users?.[index]?.salary
                              }
                              helperText={
                                formik.touched.users?.[index]?.salary &&
                                t((formik.errors.users?.[index] as any)?.salary as string, keys)
                              }
                            />
                          </TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            <CustomTextField
                              placeholder={t("hours", keys)}
                              name={`users[${index}].hours`}
                              inputProps={{ min: 0 }}
                              sx={{ minWidth: "120px" }}
                              value={formik.values.users?.[index]?.hours || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              error={
                                !!(formik.errors.users?.[index] as any)?.hours &&
                                !!formik.touched.users?.[index]?.hours
                              }
                              helperText={
                                formik.touched.users?.[index]?.hours &&
                                t((formik.errors.users?.[index] as any)?.hours as string, keys)
                              }
                            />
                          </TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            <CustomTextField
                              placeholder={t("tip_deduction", keys)}
                              name={`users[${index}].tip_deduction`}
                              inputProps={{ min: 0 }}
                              sx={{ minWidth: "120px" }}
                              value={formik.values.users?.[index]?.tip_deduction || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                              error={
                                !!(formik.errors.users?.[index] as any)?.tip_deduction &&
                                !!formik.touched.users?.[index]?.tip_deduction
                              }
                              helperText={
                                formik.touched.users?.[index]?.tip_deduction &&
                                t((formik.errors.users?.[index] as any)?.tip_deduction as string, keys)
                              }
                            />
                          </TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            <CustomTextField
                              name={`users[${index}].commission`}
                              placeholder={t("commission", keys)}
                              inputProps={{ min: 0 }}
                              sx={{ minWidth: "120px" }}
                              value={formik.values.users?.[index]?.commission || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                              error={
                                !!(formik.errors.users?.[index] as any)?.commission &&
                                !!formik.touched.users?.[index]?.commission
                              }
                              helperText={
                                formik.touched.users?.[index]?.commission &&
                                t((formik.errors.users?.[index] as any)?.commission as string, keys)
                              }
                            />
                          </TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling, fontSize: "14px", fontWeight: "500" }}>
                            ${Number(formik.values.users?.[index]?.total ?? 0)?.toFixed(2) || "0.00"}
                          </TableCell>

                          <TableCell sx={{ ...tableCellCommonStyling }}>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                alignItems: { xs: "stretch", sm: "center" },
                                gap: 1,
                              }}
                            >
                              <Button
                                sx={{
                                  height: "40px",
                                  width: { xs: "100%", sm: "auto" },
                                }}
                                onClick={() => {
                                  setOpenHistory((prev) => !prev);
                                  setSelectedUserHistory(user.payroll_payment || []);
                                }}
                                variant="outlined"
                                disabled={loading}
                              >
                                <UpdateIcon className="size-5" />
                              </Button>

                              {(((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/payroll")) ||
                                (session?.user?.roles?.includes("BackOfficeUser") &&
                                  checkAccess(
                                    (session.user as any).accessrights
                                      ?.controls as AccessRights2,
                                    "/admin/payroll",
                                    "edit"
                                  ))) && ((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/payroll")) ||
                                    (session?.user?.roles?.includes("BackOfficeUser") &&
                                      checkAccess(
                                        (session.user as any).accessrights
                                          ?.controls as AccessRights2,
                                        "/admin/payroll",
                                        "add"
                                      )))) && (<Button
                                        sx={{
                                          height: "40px",
                                          width: { xs: "100%", sm: "auto" },
                                        }}
                                        onClick={(e) => handlePayOptionsClick(e, user.id)}
                                        variant="contained"
                                        disabled={loading}
                                      >
                                        {t("pay", keys)}
                                      </Button>)}
                            </Box>

                            <Menu
                              sx={{ left: -4, top: 2 }}
                              anchorEl={anchorEl}
                              open={Boolean(anchorEl) && selectedUserId === user.id}
                              onClose={handleClose}
                            >
                              <MenuItem onClick={() => handlePayOptionSelect("keep", user.id, index)}>
                                {t("pay_and_keep", keys)}
                              </MenuItem>
                              <MenuItem onClick={() => handlePayOptionSelect("reset", user.id, index)}>
                                {t("pay_and_reset", keys)}
                              </MenuItem>
                              <MenuItem onClick={() => handlePrintSalarySelect("daily", user.id, index)}>
                                {t("print_payday", keys)}
                              </MenuItem>
                              <MenuItem onClick={() => handlePrintSalarySelect("weeekly", user.id, index)}>
                                {t("print_payweek", keys)}
                              </MenuItem>
                            </Menu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("no_user_record_found", keys)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>

                </Table>
              </TableContainer>

              {(((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/payroll")) ||
                (session?.user?.roles?.includes("BackOfficeUser") &&
                  checkAccess(
                    (session.user as any).accessrights
                      ?.controls as AccessRights2,
                    "/admin/payroll",
                    "edit"
                  ))) && ((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/payroll")) ||
                    (session?.user?.roles?.includes("BackOfficeUser") &&
                      checkAccess(
                        (session.user as any).accessrights
                          ?.controls as AccessRights2,
                        "/admin/payroll",
                        "add"
                      )))) && users?.length > 0 && <Box sx={{ display: "flex", justifyContent: "end", gap: "8px" }}>
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    sx={{ width: "172px", height: "56px", padding: "0px", mt: 2 }}
                    disabled={loading}
                    onClick={handlePayAllClick}
                  >
                    {t("pay_all", keys)}
                  </Button>

                  <Menu
                    sx={{ left: -4, top: 2 }}
                    anchorEl={payAllAnchorEl}
                    open={Boolean(payAllAnchorEl)}
                    onClose={handlePayAllClose}
                  >
                    <MenuItem onClick={() => handlePayAllOptionSelect("keep")}>
                      {t("pay_all_and_keep", keys)}
                    </MenuItem>
                    <MenuItem onClick={() => handlePayAllOptionSelect("reset")}>
                      {t("pay_all_and_reset", keys)}
                    </MenuItem>
                  </Menu>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ width: "172px", height: "56px", padding: "0px", mt: 2 }}
                    disabled={loading}
                  >
                    {t("save", keys)}
                  </Button>
                </Box>}
            </PageContainer>
            <PayrollHistoryDialog
              open={openHistory}
              onClose={() => setOpenHistory(false)}
              history={selectedUserHistory}
            />
          </form>) : (<AccessDenied />)}
    </>
  );
};

export default PayrollManagement;
