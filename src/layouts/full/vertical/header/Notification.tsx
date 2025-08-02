import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Scrollbar from "../../../../components/custom-scroll/Scrollbar";

import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Stack } from "@mui/system";
import {
  IconBellFilled,
  IconBellRinging2,
  IconPackages,
  IconPaperBag,
  IconTicket,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import { ToastErrorMessage } from "@/components/common/ToastMessages";
import axios from "axios";
import { formattedDate } from "../../../../../lib/orderStatusHelper";
import { t } from "../../../../../lib/translationHelper";
import { useSelector } from "@/store/Store";

const Notifications = () => {
  const hasNotify = useSelector((state) => state.notify.hasNotify);
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const [value, setValue] = React.useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const COMMON_TAB = [
    {
      value: "1",
      icon: <IconPaperBag width={20} height={20} />,
      label: t("orders", keys),
      disabled: false,
    },
    {
      value: "1",
      icon: <IconTicket width={20} height={20} />,
      label: t("appointments", keys),
      disabled: true,
    },
  ];
  const router = useRouter();
  const viewOrder = (id: number) => {
    router.push({
      pathname: "/admin/orders",
    });
  };
  const viewReservations = () => {
    router.push({
      pathname: "/admin/appointments",
    });
  };


  const fetchOrders = async () => {
    try {
      const response = await axios.post("/api/orders/fetchallorders", {
        fetchAll: true,
      });
      setOrders(response.data.orders);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };
  const fetchReservations = async () => {
    try {
      const response = await axios.post("/api/reservation/allreservation", {
        fetchAll: true,
      });
      setReservations(
        response.data.data?.filter(
          (r: any) => r.status === "PENDING"
        )
      );
    } catch (error) {
      ToastErrorMessage(error);
    }
  };
  const languageUpdate = useSelector((state) => state.language.languageUpdate);

  const fetchKeys = async () => {
    try {
      const response = await axios.post(
        "/api/app-translation/fetchbypagename",
        { page_name: "notification_bar" }
      );
      setKeys(response.data);
    } catch (error) {
      ToastErrorMessage(error);
    }
  };
  useEffect(() => {
    fetchKeys();
  }, [languageUpdate]);

  useEffect(() => {
    fetchOrders();
    fetchReservations();
  }, [hasNotify]);

  const totalCount = orders
    ?.filter((r) => r.order_status === "PENDING")
    ?.length + reservations
      ?.filter((r) => r.order_status === "PENDING")
      ?.length;
  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show new reservation notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          color: anchorEl2 ? "primary.main" : "text.secondary",
        }}
        onClick={handleClick2}
      >
        <Box className="relative">
          <IconBellFilled style={{ color: "#fff" }} />
          {totalCount > 0 && (
            <Box className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex justify-center items-center shadow-md">
              {totalCount > 99 ? "99+" : totalCount}
            </Box>
          )}
        </Box>
      </IconButton>

      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: 360,
            maxHeight: 500,
            padding: 0,
          },
        }}
      >
        <Stack
          direction="row"
          py={2}
          px={3}
          justifyContent="space-between"
          alignItems="center"
          borderBottom="1px solid #eee"
        >
          <Typography variant="h6">{t("notifications", keys)}</Typography>
        </Stack>

        <TabContext value={value}>
          <div className="py-3 font-bold border-b flex justify-center items-center gap-1 w-full">
            {`${reservations
              ?.filter((r) => r.status === "PENDING")
              ?.length} ${t("reservations", keys)}`}
          </div>
          {reservations
            ?.filter((r) => r.status === "PENDING")
            .map((reservation, index) => (
              <Box key={`reservation-${index}`}>
                <MenuItem
                  onClick={() => viewReservations()}
                  sx={{
                    py: 2,
                    px: 4,
                    alignItems: "flex-start",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="text.primary"
                      sx={{
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "280px",
                      }}
                    >
                      {t("new_appointment_received", keys)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "280px",
                      }}
                    >
                      {`${reservation?.staff?.first_name || ""} ${reservation?.staff?.last_name || ""}`}<br />
                      {formattedDate(reservation.created_at)}
                    </Typography>
                  </Stack>
                </MenuItem>
              </Box>
            ))}
          <div className="py-3 font-bold border-b flex justify-center items-center gap-1 w-full">
            {`${orders
              ?.filter((r) => r.order_status === "PENDING")
              ?.length} ${t("orders", keys)}`}
          </div>
          <Box>
            <TabPanel value="1" sx={{ padding: 0 }}>
              <Scrollbar sx={{ maxHeight: 400 }}>
                {orders
                  ?.filter((r) => r.order_status === "PENDING")
                  ?.map((order, index) => (
                    <Box key={`order-${index}`}>
                      <MenuItem
                        onClick={() => viewOrder(order.order_id)}
                        sx={{ py: 2, px: 4 }}
                      >
                        <Stack direction="row" spacing={2}>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="textPrimary"
                              fontWeight={600}
                              noWrap
                              sx={{ width: "240px" }}
                            >
                              {t("new_order_", keys)} {order.order_number} {t("received", keys)}.
                            </Typography>
                            <Typography
                              color="textSecondary"
                              variant="subtitle2"
                              sx={{ width: "240px" }}
                              noWrap
                            >
                              #{order.order_number} – {formattedDate(order.created_at)}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    </Box>
                  ))}
              </Scrollbar>
            </TabPanel>

          </Box>
        </TabContext>
      </Menu>
    </Box>

  );
};

export default Notifications;
