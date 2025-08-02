import React from "react";
import { styled } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { t } from "i18next";


const CustomFormLabel = styled((props: any) => (
  <Typography
    variant="subtitle1"
    fontWeight={600}
    {...props}
    component="label"
    htmlFor={props.htmlFor}
    noWrap
  >
    {props.required && <span style={{ color: "#2276ff" }}> *</span>}
    {t(props.children)}
  </Typography>
))(() => ({
  marginBottom: "0px",
  marginTop: "20px",
  display: "block",
  fontSize: "12px",
  color:"#666666",
}));

export default CustomFormLabel;
