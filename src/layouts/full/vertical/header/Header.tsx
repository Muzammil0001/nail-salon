import {
  IconButton,
  Box,
  AppBar,
  useMediaQuery,
  Toolbar,
  styled,
  Stack,
} from "@mui/material";
import { useSelector, useDispatch } from "../../../../store/Store";
import {
  toggleSidebar,
  toggleMobileSidebar,
} from "../../../../store/customizer/CustomizerSlice";
import { IconMenu2, IconPlayerPlayFilled } from "@tabler/icons-react";
import Notifications from "./Notification";
import Profile from "./Profile";
import { AppState } from "../../../../store/Store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import CompanyLocation from "./CompanyLocation";
import SuperAdminName from "./SuperAdminName";
import Breadcrumb from "@/components/header/Breadcrumb";
import AdminLanguage from "./AdminLanguage";
import { useState } from "react";
import VideoDialog from "./VideoDialog";
// import SocketManager from './SocketManager';

const Header = () => {
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
  const router = useRouter();
  const customizer = useSelector((state: AppState) => state.customizer);
  const dispatch = useDispatch();
  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: "none",
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    [theme.breakpoints.up("lg")]: {
      minHeight: customizer.TopbarHeight,
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: "100%",
    color: theme.palette.text.secondary,
  }));
  const { data: session, status }: any = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/admin/login");
    },
  });
  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        <div className="lg:hidden">
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={
              lgUp
                ? () => dispatch(toggleSidebar())
                : () => dispatch(toggleMobileSidebar())
            }
          >
            <IconMenu2 size="20" className="text-white" />
          </IconButton>
        </div>
        <Breadcrumb />
        <Box flexGrow={1} />
        <Stack
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ marginLeft: "10px" }}
        >
          <div className="flex items-center gap-5">
            {/* <div className="bg-white h-[20px] w-[20px] rounded-full flex justify-center items-center hover:cursor-pointer">
              <IconPlayerPlayFilled
                onClick={() => {
                  const videoLink = session?.user?.tutorials?.find(
                    (tutorial: any) =>
                      tutorial.href.includes(
                        `/${router.pathname.split("/")[1]}`
                      )
                  )?.link;
                  if (videoLink) {
                    setVideoUrl(videoLink);
                  }
                }}
                style={{
                  color: "#2276ff",
                  padding: "3px",
                  width: "20px",
                  height: "20px",
                }}
              />
            </div> */}
            {!session?.user.role?.includes("SuperAdmin") &&
              session?.user?.selected_location_id && (
                 <Notifications />
              )}
            <AdminLanguage />
          </div>

          <Profile />
          {session?.user.roles?.includes("SuperAdmin") ? (
            <SuperAdminName />
          ) : (
            <CompanyLocation />
          )}
        </Stack>
        {/* {videoUrl && (
          <VideoDialog
            open={!!videoUrl}
            onClose={() => setVideoUrl(null)}
            videoLink={videoUrl}
          />
        )} */}
      </ToolbarStyled>
    </AppBarStyled>
  );
};

export default Header;
