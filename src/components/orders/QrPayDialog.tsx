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
import Image from 'next/image';
import { CheckCircle } from '@mui/icons-material';
import Loader from '@/components/loader/Loader';
import { t } from '../../../lib/translationHelper';
import { useSelector } from '@/store/Store';

type QRPaymentProps = {
  open: boolean;
  onClose: () => void;
  order: any;
  setPaymentSuccessCheck: (success: boolean) => void;
};

const QRScanPaymentDialog: React.FC<QRPaymentProps> = ({
  open,
  onClose,
  order,
  setPaymentSuccessCheck,
}) => {
  const [qrCode, setQrCode] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [countdown, setCountdown] = useState(600);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "orders" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } 
    })();
  }, [languageUpdate]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    if (open && order?.id) {
      const createQR = async () => {
        try {
          const { data } = await axios.post('/api/strip/createqrpaymentlinkmobile', {
            order_id: order.id,
          });

          setOrderId(order.id);
          setQrCode(data.qrCode);
          setCheckoutUrl(data.checkoutUrl);
          setCountdown(600);
          setPaymentSuccess(false);
          setPaymentSuccessCheck(false);
        } catch (error) {
          console.error('QR Code generation failed:', error);
        }
      };

      createQR();

      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(countdownInterval);
  }, [open, order]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (open && orderId) {
      pollInterval = setInterval(async () => {
        try {
          const { data } = await axios.post("/api/orders/orderstatusverify", { id: orderId });
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
  }, [open, orderId]);

  useEffect(() => {
    if (paymentSuccess) {
      const timer = setTimeout(() => {
        onClose();
        setPaymentSuccessCheck(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  const formatTime = (seconds: number) => {
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
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{t("scan_qr_code_to_pay", keys)}</Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center' }}>
        {paymentSuccess ? (
          <Box sx={{ py: 4 }}>
            <CheckCircle sx={{ color: '#76BA1B', fontSize: 64 }} />
            <Typography variant="h5" sx={{ mt: 2, fontWeight: 600, color: '#646464' }}>
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

            <Typography variant="body2" sx={{ mb: 1 }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Loader loading={true} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QRScanPaymentDialog;
