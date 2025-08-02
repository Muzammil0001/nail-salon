import { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { useSelector } from "../../../../../store/Store";
import { IconPower } from "@tabler/icons-react";
import { AppState } from "../../../../../store/Store";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
export const Profile = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
  const hideMenu = lgUp
    ? customizer.isCollapse && !customizer.isSidebarHover
    : "";
  const [name, setName] = useState("");
  const [image, setImage] = useState("/images/profile/user-1.jpg");
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const handleSignOut = async (e: any) => {
    e.preventDefault();

    await signOut({ redirect: true, callbackUrl: "/admin/login" });
  };

  useEffect(() => {
    if (session) {
      setName(session?.user?.name || "");
      if (session?.user?.image) {
        setImage(process.env.NEXT_PUBLIC_IMG_DIR + session.user.image);
      }
    }
  }, [session]);

  return (
    <Box
      display={"flex"}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: `${"secondary.light"}` }}
    >
      {!hideMenu ? (
        <>
          <Avatar src="/user.png" alt="user">D</Avatar>

          <Box>
            <Typography variant="h6">{name}</Typography>
            {/* <Typography variant="caption">Designer</Typography> */}
          </Box>
          <Box sx={{ ml: "auto" }}>
            <Tooltip title={t("logout")} placement="top">
              <IconButton
                color="primary"
                aria-label="logout"
                size="small"
                onClick={handleSignOut}
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ""
      )}
    </Box>
  );
};
