// PreviewButton.tsx
import React from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/system';

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#06B217',
  color: theme.palette.common.white,
  borderRadius: '8px',
  padding: '10px 20px',
  transition: 'background-color 0.3s ease',
  width: '172px',
  height:'56px',
  '&:hover': {
    backgroundColor: '#05A215',
  },
}));

interface PreviewButtonProps {
  onClick: () => void;
  children: string;
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ onClick, children }) => {
  return (
    <StyledButton variant="contained" onClick={onClick}>
      {children}

      
    </StyledButton>

  );
};

export default PreviewButton;
