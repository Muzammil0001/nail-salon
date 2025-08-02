import { FC, useState } from "react";
import { Drawer, Grid, Divider, styled, IconButton, Typography, Tooltip, Stack } from "@mui/material";
import { useSelector, useDispatch } from "../../../../store/Store";
import Box, { BoxProps } from "@mui/material/Box";
import { IconX, IconCheck } from "@tabler/icons-react";
import { setTheme, setDarkMode } from "../../../../store/customizer/CustomizerSlice";
import { AppState } from "../../../../store/Store";
import Scrollbar from "../../../../components/custom-scroll/Scrollbar";
import WbSunnyTwoToneIcon from "@mui/icons-material/WbSunnyTwoTone";
import DarkModeTwoToneIcon from "@mui/icons-material/DarkModeTwoTone";
import { useTranslation } from "react-i18next";

import Loader from "../../../../components/loader/Loader";

const SidebarWidth = "320px";
interface colors {
  id: number;
  bgColor: string;
  disp?: string;
}
const Customizer: FC = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const customizer = useSelector((state: AppState) => state.customizer);
  const [loading, setLoading] = useState(false);
  const [themeColors, setThemeColors] = useState(
    customizer.activeTheme || "AQUA_THEME"
  );
  const [themeMode, setThemeMode] = useState(customizer.activeMode || "light");

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
    boxShadow: theme.shadows[8],
    padding: "20px",
    cursor: "pointer",
    justifyContent: "center",
    display: "flex",
    transition: "0.1s ease-in",
    border: "1px solid rgba(145, 158, 171, 0.12)",
    "&:hover": {
      transform: "scale(1.05)",
    },
  }));

  const updateThemeDetails = async (data: any) => {
    if (data.themeColor) {
      dispatch(setTheme(data.themeColor));
    }
    if (data.themeMode) {
      dispatch(setDarkMode(data.themeMode));
    }

    setThemeColors(data.theme_colors);
    setThemeMode(data.theme_mode);
  };

  const thColors: colors[] = [
    {
      id: 1,
      bgColor: "#5D87FF",
      disp: "BLUE_THEME",
    },
    {
      id: 2,
      bgColor: "#2276ff",
      disp: "AQUA_THEME",
    },
    {
      id: 3,
      bgColor: "#763EBD",
      disp: "PURPLE_THEME",
    },
    {
      id: 4,
      bgColor: "#0A7EA4",
      disp: "GREEN_THEME",
    },
    {
      id: 5,
      bgColor: "#01C0C8",
      disp: "CYAN_THEME",
    },
    {
      id: 6,
      bgColor: "#FA896B",
      disp: "ORANGE_THEME",
    },
  ];

  return (
    <div>
      <Loader loading={loading} />
      {/* <Tooltip title={t("settings")}>
        <Fab
          color="primary"
          aria-label="settings"
          sx={{ position: "fixed", right: "25px", bottom: "15px" }}
          onClick={() => setShowDrawer(true)}
        >
          <IconSettings stroke={1.5} />
        </Fab>
      </Tooltip> */}
      <Drawer
        anchor="right"
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        PaperProps={{
          sx: {
            width: SidebarWidth,
          },
        }}
      >
        {/* ------------------------------------------- */}
        {/* ------------ Customizer Sidebar ------------- */}
        {/* ------------------------------------------- */}
        <Scrollbar sx={{ height: "calc(100vh - 5px)" }}>
          <Box
            p={2}
            display="flex"
            justifyContent={"space-between"}
            alignItems="center"
          >
            <Typography variant="h4">{t("settings")}</Typography>

            <IconButton color="inherit" onClick={() => setShowDrawer(false)}>
              <IconX size="1rem" />
            </IconButton>
          </Box>
          <Divider />
          <Box p={3}>
            {/* ------------------------------------------- */}
            {/* ------------ Dark light theme setting ------------- */}
            {/* ------------------------------------------- */}
            <Typography variant="h6" gutterBottom>
              {t("mode")}
            </Typography>
            <Stack direction={"row"} gap={2} my={2}>
              <StyledBox
                onClick={() => {
                  dispatch(
                    setDarkMode(themeMode === "light" ? themeMode : "light")
                  );
                  updateThemeDetails({ themeMode: "light" });
                }}
                display="flex"
                gap={1}
              >
                <WbSunnyTwoToneIcon
                  color={
                    themeMode === "light"
                      ? "primary"
                      : customizer.activeMode === "light"
                      ? "primary"
                      : "inherit"
                  }
                />
                {t("light")}
              </StyledBox>
              <StyledBox
                onClick={() => {
                  dispatch(
                    setDarkMode(themeMode === "dark" ? themeMode : "dark")
                  );
                  updateThemeDetails({ themeMode: "dark" });
                }}
                display="flex"
                gap={1}
              >
                <DarkModeTwoToneIcon
                  color={
                    themeMode === "dark"
                      ? "primary"
                      : customizer.activeMode === "dark"
                      ? "primary"
                      : "inherit"
                  }
                />
                {t("dark")}
              </StyledBox>
            </Stack>

            {/* <Box pt={3} /> */}
            {/* ------------------------------------------- */}
            {/* ------------ RTL theme setting -------------*/}
            {/* ------------------------------------------- */}
            {/* <Typography variant="h6" gutterBottom>
							Theme Direction
						</Typography>
						<Stack direction={'row'} gap={2} my={2}>
							<StyledBox onClick={() => dispatch(setDir('ltr'))} display="flex" gap={1}>
								<SwipeLeftAltTwoToneIcon color={customizer.activeDir === 'ltr' ? 'primary' : 'inherit'} /> LTR
							</StyledBox>
							<StyledBox onClick={() => dispatch(setDir('rtl'))} display="flex" gap={1}>
								<SwipeRightAltTwoToneIcon color={customizer.activeDir === 'rtl' ? 'primary' : 'inherit'} /> RTL
							</StyledBox>
						</Stack> */}

            <Box pt={3} />
            {/* ------------------------------------------- */}
            {/* ------------ Theme Color setting ------------- */}
            {/* ------------------------------------------- */}
            <Typography variant="h6" gutterBottom>
              {t("theme_colors")}
            </Typography>
            <Grid container spacing={2}>
              {thColors.map((thcolor) => (
                <Grid item xs={4} key={thcolor.id}>
                  <StyledBox
                    onClick={() => {
                      dispatch(setTheme(thcolor.disp));
                      updateThemeDetails({ themeColor: thcolor.disp });
                    }}
                  >
                    <Tooltip title={`${thcolor.disp}`} placement="top">
                      <Box
                        sx={{
                          backgroundColor: thcolor.bgColor,
                          width: "25px",
                          height: "25px",
                          borderRadius: "60px",
                          alignItems: "center",
                          justifyContent: "center",
                          display: "flex",
                          color: "white",
                        }}
                        aria-label={`${thcolor.bgColor}`}
                      >
                        {themeColors === thcolor.disp ? (
                          <IconCheck width={13} />
                        ) : customizer.activeTheme === thcolor.disp ? (
                          <IconCheck width={13} />
                        ) : (
                          ""
                        )}
                      </Box>
                    </Tooltip>
                  </StyledBox>
                </Grid>
              ))}
            </Grid>
            <Box pt={4} />
            {/* ------------------------------------------- */}
            {/* ------------ Layout Horizontal / Vertical ------------- */}
            {/* ------------------------------------------- */}
            {/* <Typography variant="h6" gutterBottom>
							Layout Type
						</Typography>
						<Stack direction={'row'} gap={2} my={2}>
							<StyledBox onClick={() => dispatch(toggleHorizontal(false))} display="flex" gap={1}>
								<ViewComfyTwoTone color={customizer.isHorizontal === false ? 'primary' : 'inherit'} />
								Vertical
							</StyledBox>
							<StyledBox onClick={() => dispatch(toggleHorizontal(true))} display="flex" gap={1}>
								<PaddingTwoTone color={customizer.isHorizontal === true ? 'primary' : 'inherit'} />
								Horizontal
							</StyledBox>
						</Stack>
						<Box pt={4} /> */}
            {/* ------------------------------------------- */}
            {/* ------------ Layout Boxed / Full ------------- */}
            {/* ------------------------------------------- */}
            {/* <Typography variant="h6" gutterBottom>
							Container Option
						</Typography>
						<Stack direction={'row'} gap={2} my={2}>
							<StyledBox onClick={() => dispatch(toggleLayout('boxed'))} display="flex" gap={1}>
								<CallToActionTwoToneIcon color={customizer.isLayout === 'boxed' ? 'primary' : 'inherit'} />
								Boxed
							</StyledBox>
							<StyledBox onClick={() => dispatch(toggleLayout('full'))} display="flex" gap={1}>
								<AspectRatioTwoToneIcon color={customizer.isLayout === 'full' ? 'primary' : 'inherit'} />
								Full
							</StyledBox>
						</Stack>
						<Box pt={4} /> */}
            {/* ------------------------------------------- */}
            {/* ------------ Sidebar Color setting ------------- */}
            {/* ------------------------------------------- */}

            {/* ------------------------------------------- */}
            {/* ------------ Theme Color setting ------------- */}
            {/* ------------------------------------------- */}
            {customizer.isHorizontal ? (
              ""
            ) : (
              <>
                {/* <Typography variant="h6" gutterBottom>
									Sidebar Type
								</Typography>
								<Stack direction={'row'} gap={2} my={2}>
									<StyledBox onClick={() => dispatch(toggleSidebar())} display="flex" gap={1}>
										<WebAssetTwoToneIcon color={!customizer.isCollapse ? 'primary' : 'inherit'} />
										Full
									</StyledBox>
									<StyledBox onClick={() => dispatch(toggleSidebar())} display="flex" gap={1}>
										<ViewSidebarTwoToneIcon color={customizer.isCollapse ? 'primary' : 'inherit'} />
										mini
									</StyledBox>
								</Stack> */}
              </>
            )}
            <Box pt={4} />
            {/* <Typography variant="h6" gutterBottom>
							Card With
						</Typography>
						<Stack direction={'row'} gap={2} my={2}>
							<StyledBox onClick={() => dispatch(setCardShadow(false))} display="flex" gap={1}>
								<BorderOuter color={!customizer.isCardShadow ? 'primary' : 'inherit'} />
								Border
							</StyledBox>
							<StyledBox onClick={() => dispatch(setCardShadow(true))} display="flex" gap={1}>
								<CallToActionTwoToneIcon color={customizer.isCardShadow ? 'primary' : 'inherit'} />
								Shadow
							</StyledBox>
						</Stack>
						<Box pt={4} /> */}
            {/* ------------------------------------------- */}
            {/* ------------ Theme Color setting ------------- */}
            {/* ------------------------------------------- */}
            {/* <Typography variant="h6" gutterBottom>
							Theme Border Radius
						</Typography>

						<Slider
							size="small"
							value={customizer.borderRadius}
							aria-label="Small"
							min={4}
							max={24}
							onChange={(event: any) => dispatch(setBorderRadius(event.target.value))}
							valueLabelDisplay="auto"
						/> */}
          </Box>
        </Scrollbar>
      </Drawer>
    </div>
  );
};

export default Customizer;
