import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { t } from '../../../lib/translationHelper';
import moment from 'moment';
type ReservationDetailModalProps = {
  open: boolean;
  onClose: () => void;
  reservation: any;
  keys: { text: string; translation: string }[];
};


const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  open,
  onClose,
  reservation,
  keys,
}) => {
  const customer = reservation?.reservation_customer;
  const staff = reservation?.staff;
  const transaction = reservation?.transaction;

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
        <Typography variant="h6">{t('reservation_details', keys)}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('customer_details', keys)}
            </Typography>
            <Typography>{t('name', keys)}: {customer?.first_name} {customer?.last_name}</Typography>
            <Typography>{t('email', keys)}: {customer?.email}</Typography>
            <Typography>{t('phone', keys)}: {customer?.phone}</Typography>
            <Typography>{t('alt_phone', keys)}: {customer?.alternate_phone}</Typography>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('reservation_info', keys)}
            </Typography>
            <Typography>
              {t('reservation_number', keys)}: {reservation?.reservation_number}
            </Typography>
            <Typography>
              {t('status', keys)}: {reservation?.status}
            </Typography>
            <Typography>
              {t('date', keys)}: {moment(reservation?.date).format("DD/MM/YYYY")}
            </Typography>
            <Typography>
              {t('start_time', keys)}: {`${moment.utc(reservation?.start_time).format("h:mm A")}`}
            </Typography>
            <Typography>
              {t('last_time', keys)}: {`${moment.utc(reservation?.last_time).format("h:mm A")}`}
            </Typography>
            <Typography>
              {t('price_total', keys)}: ${reservation?.price_total}
            </Typography>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('staff_details', keys)}
            </Typography>
            <Typography>{t('name', keys)}: {staff?.first_name} {staff?.last_name}</Typography>
            <Typography>{t('email', keys)}: {staff?.email}</Typography>
            <Typography>{t('phone', keys)}: {staff?.phone}</Typography>
            <Typography>{t('country', keys)}: {staff?.country}, {staff?.city}</Typography>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('services', keys)}
            </Typography>
            {reservation?.details?.map((detail: any, idx: number) => (
              <Box key={idx} sx={{ mb: 1 }}>
                <Typography>
                  {t('service_name', keys)}: {detail.service_name}
                </Typography>
                <Typography>
                  {t('service_price', keys)}: ${detail.service_price}
                </Typography>
                <Typography>
                  {t('quantity', keys)}: {detail.quantity}
                </Typography>
              </Box>
            ))}
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('transaction_details', keys)}
            </Typography>
            <Typography>
              {t('payment_method', keys)}: {reservation?.payment_method}
            </Typography>
            <Typography>
              {t('payment_status', keys)}: {reservation?.payment_status}
            </Typography>
            <Typography>
              {t('amount', keys)}: ${transaction?.amount}
            </Typography>
           {transaction?.type?.toLowerCase()==="card" && <Typography>
              {t('stripe_status', keys)}: {transaction?.transaction_detail?.stripe_status}
            </Typography>}
            <Typography>
              {t('payment_type', keys)}: {transaction?.type}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationDetailModal;
