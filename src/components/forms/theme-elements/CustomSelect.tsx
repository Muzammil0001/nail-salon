import React from 'react';
import { styled } from '@mui/material/styles';
import { Select, SelectProps } from '@mui/material';

const CustomSelect = styled((props: any) => <Select {...props} />)(({ theme }) => ({
    height: '52px',
    '& .MuiSelect-select': {
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
    },
    '& .MuiOutlinedInput-root': {
        height: '52px',
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#CCCCCC",
    },
}));

export default CustomSelect;
