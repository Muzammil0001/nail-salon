import React from "react";
import { Button } from "@mui/material";
import { styled } from "@mui/system";

const CustomFormButton = styled(Button)(({ theme }: any) => ({
  padding: "24px 24px",
  borderRadius: "8px",
  height: "56px",
  margin: "10px",
  fontSize: "16px",
  border: "1px solid transparent",
  width: "172px",
  transition: "background-color 0.3s, box-shadow 0.3s, border-color 0.3s",
  [theme.breakpoints.up("md")]: {
    width: "155px",
    fontSize: "13px",
  },
  [theme.breakpoints.up("lg")]: {
    width: "155px",
    fontSize: "13px",
  },

  // Primary contained style
  "&.MuiButton-contained": {
    backgroundColor: theme?.palette?.primary?.main,
    color: theme?.palette?.primary?.contrastText,
    "&:hover": {
      backgroundColor: theme?.palette?.primary?.dark,
    },
  },

  // Success contained style
  "&.MuiButton-containedSuccess": {
    backgroundColor: "#06b217",
    color: theme?.palette?.success?.contrastText,
    "&:hover": {
      backgroundColor: "#02870d",
    },
  },

  // Outlined style
  "&.MuiButton-outlined": {
    borderColor: theme?.palette?.primary?.main,
    color: theme?.palette?.primary?.main,
    backgroundColor: "transparent",
    "&:hover": {
      color: "#ffffff",
      backgroundColor: "#2276ff",
    },
  },

  // Text style
  "&.MuiButton-text": {
    color: theme?.palette?.primary?.main,
    "&:hover": {
      backgroundColor: "#ffffff",
    },
  },

  // Disabled style
  "&.Mui-disabled": {
    backgroundColor: theme?.palette?.action?.disabledBackground,
    color: theme?.palette?.text?.disabled,
    borderColor: theme?.palette?.action?.disabled,
    cursor: "not-allowed",
  },
}));

export default CustomFormButton;
