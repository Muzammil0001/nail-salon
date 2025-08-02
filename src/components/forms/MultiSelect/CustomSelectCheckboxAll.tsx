import React, { ChangeEvent } from "react";
import PropTypes from "prop-types";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import { useTranslation } from "react-i18next";
interface Porps {
  label: string;
  options: any;
  value: any;
  onChange: any;
}
const CustomSelectCheckboxAll = ({
  label,
  options,
  value,
  onChange,
}: Porps) => {
  const handleChange = (event: any) => {
    const { value } = event.target;
    onChange(value);
  };

  const getSelectedLabels = () => {
    return value.map((selectedValue: any) => {
      const selectedOption = options.find(
        (option: any) => option.value === selectedValue
      );
      return selectedOption?.label;
    });
  };
  const { t } = useTranslation();
  /*const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) {
			return onChange(options.map(option => option.value));
		}
		return onChange([]);
	};*/
  const handleSelectAll = () => {
    if (options.length === value.length) {
      return onChange([]);
    }
    return onChange(options.map((option: any) => option.value));
  };
  return (
    <FormControl sx={{ width: "100%" }}>
      <Select
        multiple
        value={value}
        fullWidth
        onChange={handleChange}
        renderValue={() => getSelectedLabels().join(", ")}
        MenuProps={{
          style: {
            maxHeight: "250px",
          },
        }}
      >
        {options.length > 0 && (
          <MenuItem key={"select_all"} onClick={handleSelectAll}>
            <Checkbox
              checked={options?.length === value?.length}
              onChange={(e) => e.stopPropagation()}
            />
            {t("select_all")}
          </MenuItem>
        )}
        {options.length > 0
          ? options.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox checked={value.indexOf(option.value) > -1} />
                {option.label}
              </MenuItem>
            ))
          : ""}
      </Select>
    </FormControl>
  );
};

CustomSelectCheckboxAll.propTypes = {
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

export default CustomSelectCheckboxAll;
