import React from "react";
import {
  MenuItem,
  Select,
  Chip,
  Stack,
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
  Box,
  SelectChangeEvent,
} from "@mui/material";
import { Remove as RemoveIcon } from "@mui/icons-material";
import { IconCancel, IconX } from "@tabler/icons-react";

interface FilterWithChipsProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}

const FilterWithChips: React.FC<FilterWithChipsProps> = ({
  label,
  options,
  selectedOptions,
  onChange,
}) => {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    onChange(event.target.value as string[]);
  };

  const handleChipDelete = (chip: string) => {
    onChange(selectedOptions.filter((option) => option !== chip));
  };

  return (
    <Box>
      {/* Filter - Select Dropdown */}
      <FormControl fullWidth>
        <Select
          multiple
          value={selectedOptions}
          onChange={handleChange}
          renderValue={() => null}
          sx={{
            boxShadow: "none",
            width: "40px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
          }}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              <Checkbox checked={selectedOptions.indexOf(option) > -1} />
              <ListItemText primary={option} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Selected Chips */}
      {selectedOptions.length > 0 && (
        <Box mt={2}>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {selectedOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                sx={{
                  color: "#2276FF",
                  minWidth: "73px",
                  backgroundColor: "transparent",
                  height: "25px",
                  borderRadius: "3px",
                  border: "1px solid #2276FF",
                  opacity: 1,
                }}
                deleteIcon={
                  <IconX className="h-4 w-4" color="#2276FF" />
                }
                onDelete={() => handleChipDelete(option)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default FilterWithChips;
