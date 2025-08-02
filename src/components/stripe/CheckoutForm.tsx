import React, { useState,useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Box, Button, Typography, CircularProgress, keyframes } from '@mui/material';
import { ToastErrorMessage, ToastSuccessMessage } from '../common/ToastMessages';
import axios from 'axios';
import { t } from '../../../lib/translationHelper';
import { useSelector } from '@/store/Store';

type CheckoutFormProps = {
  clientSecret: string;
  onPaymentSuccess: (data: any) => void;
  onClose: () => void;
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onClose, clientSecret, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  
  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const language_id = localStorage.getItem("language_id");
        const response = await axios.post("/api/app-translation/fetchbypagename", {
          language_id,
          page_name: "appointment",
        });
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      }
      finally {
        setLoading(false)
      }
    })();
  }, [languageUpdate]);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      ToastErrorMessage('Stripe is not loaded.');
      return;
    }

    setLoading(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href, },
        redirect: 'if_required',
      });

      if (result.error) {
        ToastErrorMessage(result.error.message);
        onClose();
      } else if (result.paymentIntent?.status === 'succeeded') {
        ToastSuccessMessage("payment_successful");
        onPaymentSuccess({ paymentIntent: result.paymentIntent });
      }
    } catch (err) {
      console.error(err);
      onClose();
      ToastErrorMessage('Unexpected error occurred');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h6" mb={2}>
        {t("enter_card_details", keys)}
      </Typography>

      <Box
        sx={{
          border: '1px solid #ccc',
          borderRadius: 2,
          padding: 2,
          mb: 2,
        }}
      >
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </Box>

      <Button
        onClick={handleSubmit}
        sx={{ px: 6, py: 1, height: '56px', fontSize: '16px' }}
        variant="contained"
        disabled={!stripe || loading}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : t('pay', keys)}
      </Button>
    </Box>
  );
};

export default CheckoutForm;
