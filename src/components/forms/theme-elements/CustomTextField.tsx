import React from 'react';
import { styled } from '@mui/material/styles';
import { TextField } from '@mui/material';

const CustomTextField = styled((props: any) => <TextField {...props} />)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: '52px',
    '& fieldset': {
      borderColor: '#CCCCCC',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '14px',
  },
  '& .MuiOutlinedInput-input::-webkit-input-placeholder': {
    color: theme.palette.text.secondary,
    opacity: '0.8',
  },
  '& .MuiOutlinedInput-input.Mui-disabled::-webkit-input-placeholder': {
    color: theme.palette.text.secondary,
    opacity: '1',
  },
  '& .Mui-disabled .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.grey[200],
  },
    '& input[type="color"]': {
    width: '100%',
    height: '32px',
    padding: "0 10px",
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    '&::-webkit-color-swatch': {
      borderRadius: '4px',
    },
    '&::-webkit-color-swatch-wrapper': {
      padding: 0,
    },
  },

}));

export default CustomTextField;
