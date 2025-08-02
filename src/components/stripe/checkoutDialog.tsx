import { useEffect, useState } from 'react';
import CheckoutForm from './CheckoutForm';
import convertToSubcurrency from '../../../lib/convertToSubcurrency';
import axios from 'axios';
import Loader from "@/components/loader/Loader";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from '@stripe/stripe-js';
import { ToastErrorMessage } from '../common/ToastMessages';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

type PaymentSuccessData = {
  paymentIntent: any;
};

type CheckoutDialogProps = {
  open: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: (data: PaymentSuccessData) => void;
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutDialog({ open, onClose, amount, onPaymentSuccess }: CheckoutDialogProps) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (!open) return;

    const createPaymentIntent = async () => {
      try {
        if(amount <= 0) {onClose(); return;}
        const response = await axios.post('/api/strip/createpaymentintent', {
          amount: convertToSubcurrency(amount),
        });
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error('Failed to create payment intent', error);
        onClose()
        ToastErrorMessage(error);
      }
    };

    createPaymentIntent();
  }, [amount, open]);

  return (
    <Dialog open={open} 
    onClose={(event, reason) => {
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        return;
      }
      onClose();
    }}
    disableEscapeKeyDown 
    maxWidth="sm" 
    fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        
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
      <DialogContent>
        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'stripe' },
            }}
          >
            <CheckoutForm
              clientSecret={clientSecret}
              onPaymentSuccess={(data) => {
                onPaymentSuccess(data);
                onClose();
              }}
              onClose={onClose}
            />
          </Elements>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}>
            <Loader loading={true} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
