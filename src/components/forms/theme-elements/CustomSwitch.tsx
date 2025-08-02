import React from "react";
import { styled } from "@mui/material/styles";
import { Switch } from "@mui/material";

const CustomSwitch = styled((props: any) => <Switch {...props} />)(
  ({ theme }) => ({
    "&.MuiSwitch-root": {
      width: "68px",
      height: "49px",
    },
    "&  .MuiButtonBase-root": {
      top: "6px",
      left: "6px",
    },
    "&  .MuiButtonBase-root.Mui-checked .MuiSwitch-thumb": {
      backgroundColor: "primary.main",
    },
    "& .MuiSwitch-thumb": {
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      color: theme.palette.background.paper,
    },

    "& .MuiSwitch-track": {
      backgroundColor: theme.palette.grey[200],
      opacity: 1,
      borderRadius: "12px",
    },
    "& .MuiSwitch-switchBase": {
      "&.Mui-checked": {
        "& + .MuiSwitch-track": {
          backgroundColor: theme.palette.primary.main,
          opacity: 100,
        },
      },
    },
  })
);

export default CustomSwitch;
