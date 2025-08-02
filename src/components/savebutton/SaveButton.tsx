import React from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/system';

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main, // Use primary color from theme
  color: theme.palette.common.white,
  borderRadius: '8px',
  padding: '10px 20px',
  transition: 'background-color 0.3s ease',
  width: '172px',
  height: '56px',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark, // Use darker shade on hover
  },
}));

interface SaveButtonProps {
  onClick: () => void;
  children: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onClick, children }) => {
  return (
    <StyledButton variant="contained" onClick={onClick}>
      {children} 
    </StyledButton>
  );
};

export default SaveButton;
