import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    List,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import { useSelector } from "@/store/Store";
import axios from "axios";
import { t } from "../../../lib/translationHelper";
import { useState, useEffect } from 'react';

interface PayrollPayment {
    id: string;
    pay_period_start: string;
    pay_period_end: string;
    worked_hours: number;
    per_hour_salary: number;
    commission: number;
    tip_deduction: number;
    gross_salary: number;
    net_salary: number;
    paid_at: string;
  }
  interface PayrollHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    history: PayrollPayment[];
};

export default function PayrollHistoryDialog({ open, onClose, history }: PayrollHistoryDialogProps) {
    const languageUpdate = useSelector((state) => state.language.languageUpdate);
    const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const response = await axios.post("/api/app-translation/fetchbypagename", { page_name: "payroll" });
                setKeys(response.data);
            } catch (error) {
                console.error("Error while fetching translations:", error);
            }
        })();
    }, [languageUpdate]);

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                onClose();
            }}
            disableEscapeKeyDown
            maxWidth="sm"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    minHeight: "500px",
                },
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <HistoryIcon color="primary" />
                    <Typography variant="h6">{t("payment_history", keys)}</Typography>
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: "300px", maxHeight: "500px" }}>
                {history?.length === 0 ? (
                    <Typography textAlign="center" color="textSecondary">
                        {t("no_payment_history_available", keys)}
                    </Typography>
                ) : (
                    <List dense>
                        {history.map((payment) => (
                            <Box key={payment.id} mb={2}>
                               {payment?.net_salary > 0 && (<Card
                                    elevation={1}
                                    sx={{
                                        borderRadius: 0,
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e0e0e0',
                                        transition: '0.3s ease-in-out',
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                                            backgroundColor: '#fdfdfd',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="h6" fontWeight={600}>
                                                    ${payment.net_salary.toFixed(2)} {t("paid", keys)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" mt={0.5}>
                                                    {t("paid_on", keys)}: {new Date(payment.paid_at).toLocaleString()}
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>{t("pay_period", keys)}:</strong> {new Date(payment.pay_period_start).toLocaleDateString("en-GB")} – {new Date(payment.pay_period_end).toLocaleDateString("en-GB")}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>{t("worked_hours", keys)}:</strong> {payment.worked_hours}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>{t("rate_per_hour", keys)}:</strong> ${payment.per_hour_salary.toFixed(2)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>{t("commission", keys)}:</strong> {payment.commission.toFixed(2)}%
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>{t("tips_deducted", keys)}:</strong> ${payment.tip_deduction.toFixed(2)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>{t("gross", keys)}:</strong> ${payment.gross_salary.toFixed(2)} | <strong>{t("net", keys)}:</strong> ${payment.net_salary.toFixed(2)}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>

                                </Card>)}
                            </Box>
                        ))}
                    </List>
                )}
            </DialogContent>
        </Dialog>
    );
}
