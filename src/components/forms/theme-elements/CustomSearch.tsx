import React from "react";
import { styled } from "@mui/material/styles";
import { InputAdornment, TextField } from "@mui/material";
import { IconSearch, IconX } from "@tabler/icons-react";

const CustomSearch = styled((props: any) => {
  const { value, onChange, onSearchClick, onClearClick, placeholder } = props;

  return (
    <TextField
      {...props}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <IconSearch
              size={16}
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (onSearchClick) onSearchClick();
              }}
            />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconX
              size={18}
              style={{ cursor: "pointer", fontWeight:"" }}
              onClick={() => {
                if (onClearClick) onClearClick();
              }}
            />
          </InputAdornment>
        ) : null,
      }}
      sx={{
        backgroundColor: "white !important",
        borderRadius: "50px !important",
        overflow: "hidden",
        '& .MuiOutlinedInput-root': {
          borderRadius: "50px !important",
          color: "#2a3547 !important",
          '&.Mui-focused': {
            borderColor: '#3b82f6 !important',
          },
        },
        '& input': {
          color: "#2a3547 !important",
        },
      }}
    />
  );
})(({ theme }) => ({}));

export default CustomSearch;
