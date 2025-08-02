import React, { useEffect, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { Typography, Box } from '@mui/material';
import {t} from "i18next"

type ToastStatus = 'success' | 'error' | 'warning';

type ToastProps = {
    message: string;
    status: ToastStatus;
    duration?: number;
    setToastProps: React.Dispatch<React.SetStateAction<any>>;
};

const StatusIcons = {
    success: <CheckCircleIcon fontSize="small" style={{ color: '#06B217' }} />,
    error: <ErrorIcon fontSize="small" style={{ color: '#D32030' }} />,
    warning: <WarningIcon fontSize="small" style={{ color: '#FFC700' }} />,
};

const StyledToastContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: '#000000',
    padding: theme.spacing(1, 2),
}));

const Toast: React.FC<ToastProps> = ({ message, status, duration = 6000, setToastProps }) => {
    const [open, setOpen] = useState(true);
    const [toastData, setToastData] = useState<{ message: string; status: ToastStatus; duration: number }>({ message, status, duration });

    const handleClose = (_: React.SyntheticEvent | Event, reason?: string) => {
        if (reason !== 'clickaway') {
            setOpen(false);
            setToastProps(null);
        }
    };

    useEffect(() => {
        if (message && status) {
            setToastData({ message, status, duration });
            setOpen(true);
        }
    }, [message, status, duration]);

    const Icon = toastData?.status ? StatusIcons[toastData.status] : null;

    return (
        <Snackbar
            open={open}
            autoHideDuration={toastData?.duration}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Box sx={{ backgroundColor: "#ffffff" }}>
                <StyledToastContent>
                    {Icon}
                    <Typography variant="body2" sx={{ flex: 1 }}>
                        {t(toastData?.message)}
                    </Typography>
                    <IconButton size="small" onClick={handleClose} sx={{ color: '#000000' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </StyledToastContent>
            </Box>
        </Snackbar>
    );
};

export default Toast;
