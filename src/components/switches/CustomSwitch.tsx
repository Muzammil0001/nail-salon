import React from "react";
import { Switch, styled } from "@mui/material";

// Styled component
const CustomSwitch = styled(Switch)(({ theme }) => ({
    width: 42, // Decreased width of the switch
    height: 20, // Decreased height of the switch
    padding: 0,
    display: 'flex',
    '&:active': {
      '& .MuiSwitch-thumb': {
        width: 16, // Adjusted thumb size during active state
      },
      '& .MuiSwitch-switchBase.Mui-checked': {
        transform: 'translateX(10px)', // Adjust based on new width
      },
    },
    '& .MuiSwitch-switchBase': {
      padding: 2,
      '&.Mui-checked': {
        transform: 'translateX(22px)', // Adjust based on new width
        color: '#fff',
        '& + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: '#1890ff',
          ...theme.applyStyles('dark', {
            backgroundColor: '#177ddc',
          }),
        },
      },
    },
    '& .MuiSwitch-thumb': {
      boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
      width: 16, // Adjusted thumb width to be smaller
      height: 16, // Adjusted thumb height to be smaller
      borderRadius: '50%', // Keep it circular
      transition: theme.transitions.create(['width', 'height'], {
        duration: 200,
      }),
    },
    '& .MuiSwitch-track': {
      width: 42, // Set track width to match the switch width
      borderRadius: 10, // Adjust border radius as needed
      opacity: 1,
      backgroundColor: 'rgba(0,0,0,.25)',
      boxSizing: 'border-box',
      ...theme.applyStyles('dark', {
        backgroundColor: 'rgba(255,255,255,.35)',
      }),
    },
}));

// Functional component
const CustomSwitchComponent = () => {
  return null; // Add your component logic if needed
};

export default CustomSwitch;
