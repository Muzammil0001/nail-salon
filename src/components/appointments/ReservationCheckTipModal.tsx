import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    TextField,
    Button,
    Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { t } from '../../../lib/translationHelper';
import axios from 'axios';
import { ToastErrorMessage, ToastSuccessMessage } from "../common/ToastMessages";
import CustomTextField from '../forms/theme-elements/CustomTextField';
import CustomSwitch from '../switches/CustomSwitch';

type ReservationCheckTipModalProps = {
    open: boolean;
    onClose: () => void;
    reservation: any;
    keys: { text: string; translation: string }[];
};

const ReservationCheckTipModal: React.FC<ReservationCheckTipModalProps> = ({
    open,
    onClose,
    reservation,
    keys,
}) => {
    const [tipAmount, setTipAmount] = useState<number | string>('');
    const [tipError, setTipError] = useState('');
    const [loading, setLoading] = useState(false);
    const [markFullPaid, setMarkFullPaid] = useState(false);

    const handleAddCheckTip = async () => {
        const numericTip = Number(tipAmount);
        if (tipAmount === '' || isNaN(numericTip) || numericTip < 0) {
            setTipError(t('please_enter_valid_tip', keys) || "Please enter a valid, non-negative tip amount.");
            return;
        }

        setTipError("");
        try {
            setLoading(true);
            const response = await axios.post("/api/turntracker/paychecktip", {
                reservation_id: reservation?.id,
                pay_amount: numericTip,
                mark_full_paid: markFullPaid,
            });

            ToastSuccessMessage(response?.data?.message);
            setTipAmount('');
            setMarkFullPaid(false);
            onClose();
        } catch (error) {
            console.error("Error submitting tip amount:", error);
            ToastErrorMessage("Failed to submit tip amount.");
        } finally {
            setLoading(false);
        }
    };

    const customer = reservation?.reservation_customer;

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                onClose();
            }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">{t('check_tip', keys)}</Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography>
                            <strong>{t('customer_name', keys)}:</strong> {customer?.first_name} {customer?.last_name}
                        </Typography>
                        <Typography>
                            <strong>{t('email', keys)}:</strong> {customer?.email}
                        </Typography>
                        <Typography>
                            <strong>{t('reservation_number', keys)}:</strong> {reservation?.reservation_number}
                        </Typography>
                        <Typography>
                            <strong>{t('promissed_check_amount', keys)}:</strong> ${reservation?.check_remaining_amount || 0}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <CustomTextField
                            fullWidth
                            label={t('enter_tip_amount', keys)}
                            type="number"
                            value={tipAmount}
                            onChange={(e: any) => setTipAmount(e.target.value)}
                            inputProps={{ min: 0 }}
                            error={Boolean(tipError)}
                            helperText={tipError}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Grid container alignItems="center" justifyContent="flex-end" spacing={1}>
                            <Grid item>
                                <Typography sx={{ mb: 1 }}>
                                    {t('mark_full_paid', keys)}
                                </Typography>
                            </Grid>
                            <Grid item>
                                <CustomSwitch
                                    checked={markFullPaid}
                                    onChange={(e) => setMarkFullPaid(e.target.checked)}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                </Grid>
            </DialogContent>

            <DialogActions sx={{ mx: "15px" }}>
                <Button
                    onClick={handleAddCheckTip}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                >
                    {loading ? t('saving', keys) : t('save', keys)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReservationCheckTipModal;
