import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import convertToSubcurrency from '../../../lib/convertToSubcurrency';
import Loader from "@/components/loader/Loader";
import Image from 'next/image';
import { CheckCircle } from '@mui/icons-material';
import { t } from '../../../lib/translationHelper';
import { useSelector } from '@/store/Store';

type QRPaymentProps = {
  open: boolean;
  onClose: () => void;
  reservation: any;
  setPaymentSuccessCheck: (success: boolean) => void;
};

const QRPayPaymentDialog: React.FC<QRPaymentProps> = ({ open, onClose, reservation, setPaymentSuccessCheck }) => {
  const [qrCode, setQrCode] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [countdown, setCountdown] = useState(600);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const language_id = localStorage.getItem("language_id");
        const response = await axios.post("/api/app-translation/fetchbypagename", {
          language_id,
          page_name: "appointment",
        });
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      }
    })();
  }, [languageUpdate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (open && reservation) {
      const createQR = async () => {
        try {
          const { data } = await axios.post('/api/strip/createqrpaymentlinkmobile', {
            reservation_id:reservation?.id,
          });
          
          setReservationId(reservation?.id);
          setQrCode(data.qrCode);
          setCheckoutUrl(data.checkoutUrl);
          setCountdown(600);
          setPaymentSuccess(false);
          setPaymentSuccessCheck(false)
        } catch (error) {
          console.error('QR Code generation failed:', error);
        }
      };

      createQR();

      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [reservation]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (open && reservationId) {
      pollInterval = setInterval(async () => {
        try {

          const { data } = await axios.post("/api/reservation/verifystatus", {
            id: reservationId,
          });
          if (data.verified) {
            setPaymentSuccess(true);
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error('Failed to check payment status', err);
        }
      }, 3000);
    }

    return () => clearInterval(pollInterval);
  }, [open, reservationId]);

  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        onClose();
        setPaymentSuccessCheck(true)
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, onClose]);

  const formatTime: any = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="h6">{t("scan_qr_code_to_pay", keys)}</Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center' }}>
        {paymentSuccess ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircle sx={{ color: '#76BA1B', fontSize: 64 }} />
            <Typography
              variant="h5"
              sx={{ marginTop: '16px', fontWeight: 600, color: '#646464' }}
            >
              {t("congratulations", keys)}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, color: '#6B7280' }}>
              {t("your_payment_was_successful_thanks", keys)}
            </Typography>
          </Box>
        ) : qrCode && countdown > 0 ? (
          <Box>
            <Box
              sx={{
                width: 200,
                height: 200,
                margin: '0 auto 16px',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Image
                src={qrCode}
                alt={t("scan_to_pay", keys)}
                width={200}
                height={200}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
              />
            </Box>

            <Typography variant="body2" sx={{ marginBottom: 1 }}>
              {t("session_expires_in", keys)} <strong>{formatTime(countdown)}</strong>
            </Typography>

            <Typography variant="body2">
              {t("or", keys)}{' '}
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                {t("click_here_to_pay", keys)}
              </a>
            </Typography>
          </Box>
        ) : countdown === 0 ? (
          <Box sx={{ py: 4 }}>
            <Typography variant="h6" gutterBottom color="error">
              {t("payment_session_expired", keys)}
            </Typography>
            <Typography variant="body2">
              {t("please_close_and_reopen_to_generate_new_qr_code", keys)}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
          >
            <Loader loading={true} />
          </Box>
        )}
      </DialogContent>


    </Dialog>
  );
};

export default QRPayPaymentDialog;
