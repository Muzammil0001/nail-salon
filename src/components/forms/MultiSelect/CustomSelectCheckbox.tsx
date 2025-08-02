import React from "react";
import PropTypes from "prop-types";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import { useTranslation } from "react-i18next";
import CustomSelect from "../theme-elements/CustomSelect";
import CustomCheckbox from "../theme-elements/CustomCheckbox";
import { Avatar } from "@mui/material";
interface Porps {
  label: string;
  options: any;
  value: any;
  onChange: any;
  sx?: any;
  disabled?: boolean;
}
const CustomSelectCheckbox = ({
  label,
  options,
  value,
  onChange,
  sx,
  disabled,
}: Porps) => {
  const handleChange = (event: any) => {
    const { value } = event.target;
    onChange(value);
  };
  const getSelectedLabels = () => {
    return value.map((selectedValue: any) => {
      const selectedOption = options?.find(
        (option: any) => option.value === selectedValue
      );
      return selectedOption?.label;
    });
  };
  const { t } = useTranslation();
  return (
    <FormControl sx={{ width: "100%" }}>
      <CustomSelect
        labelId={value?.length === 0 ? "select-placeholder-label" : ""}
        multiple
        sx={{ textTransform: "capitalize", paddingRight: "32px", ...sx }}
        value={value}
        displayEmpty
        fullWidth
        onChange={handleChange}
        renderValue={(selected: any) =>
          selected.length > 0 ? getSelectedLabels().join(", ") : t(label)
        }
        MenuProps={{
          style: {
            maxHeight: "250px",
          },
        }}
        disabled={disabled}
      >
        <MenuItem value="" disabled sx={{ color: "gray", fontStyle: "italic" }}>
          {label}
        </MenuItem>
        {options?.length > 0
          ? options?.map((option: any) => (
              <MenuItem
                disabled={option.disabled}
                key={option.value}
                value={option.value}
                sx={{ textTransform: "capitalize" }}
              >
                <CustomCheckbox
                  disabled={option.disabled}
                  checked={value.indexOf(option.value) > -1}
                />
                {option.icon && (
                  <Avatar
                    src={option.icon}
                    sx={{ width: 24, height: 24, marginRight: 1 }}
                  />
                )}
                {option.label}
              </MenuItem>
            ))
          : ""}
      </CustomSelect>
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
