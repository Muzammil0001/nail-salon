import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Menu,
  Avatar,
  Typography,
  Divider,
  Button,
  IconButton,
} from "@mui/material";
import * as dropdownData from "./data";

import { IconMail } from "@tabler/icons-react";
import { Stack } from "@mui/system";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const { data: session, status }: any = useSession();
  useEffect(() => {
    if (session) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      if (session.user.image) {
        setImage(process.env.NEXT_PUBLIC_IMG_DIR + session.user.image);
      }
    }
  }, [session]);
  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };
  const handleSignOut = async (e: any) => {
    e.preventDefault();
    await signOut({ redirect: true, callbackUrl: "/admin/login" });
  };

  const { t } = useTranslation();
  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={image || "/user.png"}
          alt={"ProfileImg"}
          sx={{
            width: 40,
            height: 40,
          }}
        />
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
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
            p: 4,
          },
        }}
      >
        <Typography variant="h5">{t("user_profile")}</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          <Avatar
            src={image || "/images/profile/user-1.jpg"}
            alt={"ProfileImg"}
            sx={{ width: 95, height: 95 }}
          />
          <Box>
            <Typography
              variant="subtitle2"
              color="textPrimary"
              fontWeight={600}
            >
              {name}
            </Typography>
            {/* <Typography variant="subtitle2" color="textSecondary">
              Designer
            </Typography> */}
            <Box
              sx={{
                display: "flex",
                alignItems: "start",
                gap: 1,
              }}
              
            >
              <IconMail width={15} height={15} className="mt-1"/>
              
              <Typography 
              variant="subtitle2"
              color="textSecondary" sx={{width: "90%",wordBreak:"break-word"}}>{email}</Typography>
            </Box>
          </Box>
        </Stack>
        <Divider />
        {session?.user?.navigation?.includes("/user/profile") && (
          <>
            {dropdownData.profile.map((profile) => (
              <Box key={profile.title}>
                <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
                  <Link href={profile.href}>
                    <Stack direction="row" spacing={2}>
                      <Box
                        width="45px"
                        height="45px"
                        bgcolor="primary.light"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Avatar
                          src={image}
                          alt={profile.icon}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 0,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          color="textPrimary"
                          className="text-hover"
                          noWrap
                          sx={{
                            width: "240px",
                          }}
                        >
                          {t(
                            profile.title
                              .trim()
                              .toLowerCase()
                              .replace(/ /g, "_")
                              .replace(/[^\w\s]/g, "")
                          )}
                        </Typography>
                        <Typography
                          color="textSecondary"
                          variant="subtitle2"
                          sx={{
                            width: "240px",
                          }}
                          noWrap
                        >
                          {t(
                            profile.subtitle
                              .trim()
                              .toLowerCase()
                              .replace(/ /g, "_")
                              .replace(/[^\w\s]/g, "")
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Link>
                </Box>
              </Box>
            ))}
          </>
        )}
        <Box mt={2}>
          {/* <Box bgcolor="primary.light" p={3} mb={3} overflow="hidden" position="relative">
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="h5" mb={2}>
                  Unlimited <br />
                  Access
                </Typography>
                <Button variant="contained" color="primary">
                  Upgrade
                </Button>
              </Box>
              <Image src={"/images/backgrounds/unlimited-bg.png"} alt="unlimited" className="signup-bg"/>
            </Box>
          </Box> */}
          <Button
            onClick={handleSignOut}
            variant="outlined"
            color="primary"
            fullWidth
          >
            {t("logout")}
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
