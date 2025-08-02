import React from 'react';
import { TextField, InputAdornment, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'; // Import the search icon

interface SearchBarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearch }) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: "fit-content",
        borderRadius: '25px',
        backgroundColor: 'background.paper',
      }}
    >
      <TextField
        variant="outlined"
        placeholder='Search'
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{
          borderRadius: '25px',
          '& .MuiOutlinedInput-root': {
            borderRadius: '25px',
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </Paper>
  );
};

export default SearchBar;
