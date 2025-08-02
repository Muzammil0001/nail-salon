import React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { styled } from "@mui/material/styles";

const StyledPhoneInput = styled("div")(({ theme }) => ({
  width: "100%",
  "& .PhoneInput": {
    width: "100%",
    height: "52px",
    border: "1px solid #CCCCCC",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    padding: "10 14px",
    fontSize: "16px",
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
    "&:hover": {
      borderColor: theme.palette.grey[200],
    },
    "&:focus-within": {
    //   borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
      border: `2px solid ${theme.palette.primary.main}`
      
    },
  },
  "& .PhoneInputInput": {
    flexGrow: 1,
    border: "none",
    outline: "none",
    fontSize: "16px",
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
    "&::placeholder": {
      color: theme.palette.text.secondary,
      opacity: "0.8",
    },
  },
  "& .PhoneInputCountry": {
    display: "flex",
    alignItems: "center",
    marginRight: "8px",
    borderRight: "1px solid #CCCCCC !important",
    padding: "16px",
  },
  "& .PhoneInputCountrySelect": {
    border: "none",
    background: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: theme.palette.text.primary,
  },
  "& .PhoneInputCountryIcon": {
    marginRight: "4px",
  },
}));

const CustomPhoneInput = (props: any) => (
  <StyledPhoneInput>
    <PhoneInput
      {...props}
      className="PhoneInput"
      inputClassName="PhoneInputInput"
      countrySelectProps={{
        className: "PhoneInputCountrySelect",
      }}
    />
  </StyledPhoneInput>
);

export default CustomPhoneInput;
