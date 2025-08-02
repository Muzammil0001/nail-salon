import { Box, Divider, useTheme } from "@mui/material";
type Props = {
  children: any | JSX.Element | JSX.Element[];
  topbar?: any | JSX.Element | JSX.Element[];
  css?: object | "";
};
const PageContainer = ({ children, topbar, css }: Props) => {
  const theme = useTheme();
  return (
    <>
      {topbar ? (
        <Box
          sx={{ position: "relative", background: theme.palette.info.light }}
        >
          <Box
            className="w-full top-[70px] z-10 p-4 rounded-none mt-[0.5px] pb-8"
            sx={{ backgroundColor: theme.palette.primary.main }}
          >
            <Box>{topbar}</Box>
          </Box>
          <Box
            sx={{
              padding: "20px",
              marginY: "20px",
              background: theme.palette.background.paper,
              marginX: "20px",
              transform: "translateY(-40px)",
              ...css,
            }}
          >
            <Box>{children}</Box>
          </Box>
        </Box>
      ) : (
        <Box>{children}</Box>
      )}
    </>
  );
};
export default PageContainer;