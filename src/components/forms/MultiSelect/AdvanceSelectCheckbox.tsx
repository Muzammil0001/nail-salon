import React from "react";
import PropTypes from "prop-types";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import { capitalize } from "lodash";
interface Porps {
  label: string;
  options: any;
  value: any;
  onChange: any;
  onClose?: any;
  sx?: any;
  placeholder?: string;
  fullWidth?: boolean;
}
const CustomSelectCheckbox = ({
  label,
  options,
  value,
  onChange,
  onClose,
  placeholder = "",
  sx,
  fullWidth,
}: Porps) => {
  const handleChange = (event: any) => {
    const { value } = event.target;
    onChange(value);
  };

  // const handleClose = (e: any) => {
  //   onClose(e);
  // };

  const getSelectedLabels = () => {
    return value.map((selectedValue: any) => {
      const selectedOption = options.find(
        (option: any) => option.value === selectedValue
      );
      return selectedOption?.label;
    });
  };

  return (
    <FormControl fullWidth={fullWidth}>
      <Select
        sx={{ textTransform: "capitalize", ...sx }}
        multiple
        value={value}
        fullWidth
        onChange={handleChange}
        displayEmpty
        renderValue={() => {
          const selectedValues = getSelectedLabels().join(", ");
          return selectedValues ? (
            selectedValues
          ) : (
            <span className="text-slate-400 font-light">{placeholder}</span>
          );
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              minWidth: "auto",
            },
          },
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left",
          },
          style: {
            maxHeight: "250px",
          },
        }}
      >
        {options.length > 0
          ? options.map((option: any) => (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{ textTransform: "capitalize" }}
              >
                <Checkbox checked={value.indexOf(option.value) > -1} />
                {option.label}
              </MenuItem>
            ))
          : ""}
      </Select>
    </FormControl>
  );
};

CustomSelectCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CustomSelectCheckbox;
