import {
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Stack } from "@mui/system";
import { IconBrandGoogleAnalytics } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import io from "socket.io-client";
import axios from "axios";
const SocketManager = ({ session }: any) => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const fetchRestaurants = async () => {
    try {
      const response = await axios.post("/api/restaurants/fetchrestaurants", {
        merchant_id: session?.user.merchant_id,
        roleId: session?.user.roleId,
      });
      setStores(response.data);
    } catch (error) {
      console.log(error, "error");
    }
  };

  const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}`);
  const [stores, setStores] = useState<Record<string, any>>([]);
  useEffect(() => {
    if (
      session &&
      session.user &&
      (session?.user?.role === "Manager" || session?.user?.role === "Owner")
    ) {
      const userId = `admin_${process.env.NEXT_PUBLIC_URL}_${session.user.merchant_id}`;
      socket.emit("join", userId);

      fetchRestaurants();
    }
  }, []);
  useEffect(() => {
    if (
      session &&
      session.user &&
      (session?.user?.role === "Manager" || session?.user?.role === "Owner")
    ) {
      const userId = `admin_${process.env.NEXT_PUBLIC_URL}_${session.user.merchant_id}`;
      socket.on("customer_visit", (data: any) => {
        setUsersAnalytics(data);
      });
      return () => {
        socket.off(userId);
      };
    }
  }, []);
  const { t } = useTranslation();
  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };
  const [usersAnalytics, setUsersAnalytics] = useState<Record<string, any>>();

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          color: anchorEl2 ? "primary.main" : "text.secondary",
        }}
        onClick={handleClick2}
      >
        <Box>
          <IconBrandGoogleAnalytics size="21" stroke="1.5" />
          <Chip
            label={usersAnalytics?.totalUsers || 0}
            color="primary"
            size="small"
            sx={{ fontSize: "10px", marginTop: "-5px" }}
          />
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
            width: "360px",
          },
        }}
      >
        <Stack direction="column" py={2} px={4} gap={2}>
          <Typography variant="h6">{t("active_users_traffic")}</Typography>
          {usersAnalytics?.activeUsers?.map((item: any) => (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography>
                  {
                    stores?.find(
                      (store: Record<string, any>) => store.id === item.store
                    )?.name
                  }
                </Typography>
                <Typography>{item?.count}</Typography>
              </Box>
              <Divider orientation="horizontal" />
            </>
          ))}
        </Stack>
      </Menu>
    </Box>
  );
};

export default SocketManager;
