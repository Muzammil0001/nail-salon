import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Importing outlined check circle icon
import { Box, Typography } from '@mui/material'; // Import Box and Typography for layout
// Ensure you import your CSS file for blur effect

interface MuiDialogProps {
  title: string;
  content: string;
}

export default function PaymentSuccesModal({ title, content }: MuiDialogProps) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className={open ? 'blur' : ''}> 
      <Button  fullWidth variant="contained" size="medium" onClick={handleClickOpen}>  
      PAY
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{ borderRadius: "35px" }}
      >
        <DialogTitle id="alert-dialog-title">
          <Box display="flex" alignItems="center" justifyContent="center"> {/* Centering the content */}
            <CheckCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 40, mr: 1 }} /> {/* Primary color for tick mark */}
            <Typography variant="h6">{title}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {content}
          </DialogContentText>
          <Typography variant="h4" sx={{ mt: 2, fontSize: 28, textAlign: 'center' }}>
          🎊 Your payment has been received!
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}>
            Thank you for your purchase. We are processing your order and will send you an update shortly.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', mb: 4 }}> {/* Centering the button */}
          <Button onClick={handleClose} color="primary">
            GO TO YOUR DASHBOARD
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
