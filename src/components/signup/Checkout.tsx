import { useEffect, useState } from "react";
import { Box, Container } from "@mui/material";
import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";
import { useRouter } from "next/router";
import { toast } from "sonner";
import axios from "axios";
import Loader from "@/components/loader/Loader";
import { ToastErrorMessage } from "../common/ToastMessages";

const Checkout = ({
  total,
  handleSubmit,
  shopperReference,
}: {
  total: number;
  handleSubmit: any;
  shopperReference: string;
}) => {
  const router = useRouter();
  const [paymentMethodsResponse, setPaymentMethodsResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<any>(null);
  const [cardComponent, setCardComponent] = useState<any>(null);
  const [cardSession, setCardSession] = useState<any>(null);
  const isAuthenticate = async (valid: string, sessionResult: any) => {
    if (valid === "Authorised") {
      await handleSubmit({ ...cardSession, sessionResult });
    } else {
      ToastErrorMessage("unauthorized_access")
    }
  };

  async function createCheckoutSession(data: {
    total: number;
    email: any;
    shopperReference: any;
  }) {
    try {
      return await axios.post("/api/payment/createsession", {
        ...data,
        currency: "EUR",
      });
    } catch (error) {
      //console.log(error);
      throw new Error(error as any);
    }
  }
  async function submitAdditionalDetails(data: any) {
    try {
      const response = await axios.post(
        "/api/payment/submitadditionaldetails",
        data
      );
      if (response.data.action) {
        checkout
          .createFromAction(response.data.action)
          .mount("#customCard-container");
      }
    } catch (error) {
      console.error("Error submitting additional details:", error);
    }
  }
  useEffect(() => {
    const getSession = async (checkoutInstance: any) => {
      const data = {
        total: total,
        email: checkoutInstance,
        shopperReference,
      };
      createCheckoutSession(data).then(({ data }) => {
        setCardSession(data);
      });
    };

    getSession(checkout);
    const fetchPaymentMethods = async () => {
      try {
        const response = await axios.post("/api/payment/getpaymentmethods", {
          currency: "EUR",
        });
        setPaymentMethodsResponse(response.data);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };

    fetchPaymentMethods();
  }, [total]);
  useEffect(() => {
    const handleAdditionalDetails = async (state: any, component: any) => {
      await submitAdditionalDetails(state.data);
    };
    const handlePaymentCompleted = (result: any, component: any) => {
      isAuthenticate(result.resultCode, result.sessionResult);
    };
    const newCheckout = async () => {
      try {
        if (paymentMethodsResponse && cardSession) {
          const checkoutInstance = await AdyenCheckout({
            locale: "en_US",
            environment: process.env.NEXT_PUBLIC_ADYEN_ENVI,
            clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY,
            onChange: handleOnChange,
            onError: (error: any) => console.error(error),
            onAdditionalDetails: handleAdditionalDetails,
            onPaymentCompleted: handlePaymentCompleted,

            paymentMethodsResponse,
            analytics: {
              enabled: false,
            },
            session: {
              id: cardSession.id,
              sessionData: cardSession.sessionData,
            },
            paymentMethodsConfiguration: {
              card: {
                hasHolderName: true,
                holderNameRequired: true,
                storePaymentMethod: true,
              },
            },
          });
          setCheckout(checkoutInstance);
        }
      } catch (error: any) {
        ToastErrorMessage(error)
      } finally {
        setLoading(false);
      }
    };
    newCheckout();
  }, [paymentMethodsResponse, cardSession, total]);
  const handleOnChange = (state: any, component: any) => {
    if (state.isValid) {
      setCardComponent(component);
    }
  };

  useEffect(() => {
    if (checkout) {
      const container = document.getElementById("customCard-container");
      if (container) {
        setCardComponent(
          checkout
            .create("dropin", {
              type: "card",
              brands: ["mc", "visa", "amex", "bcmc", "maestro"],
              ariaLabels: {
                lang: "en-GB",
                encryptedCardNumber: {
                  label: "Credit or debit card number field",
                  iframeTitle: "Iframe for secured card number",
                  error: "Invalid Card Number",
                },
                encryptedExpiryDate: {
                  label: "Credit or debit card expiry field",
                  iframeTitle: "Iframe for secured card expiry",
                  error: "Invalid Card Expiry Date",
                },
                encryptedSecurityCode: {
                  label: "Credit or debit card cvv / cvc",
                  iframeTitle: "Iframe for secured card cvv / cvc",
                  error: "Invalid Card CVC/CVV",
                },
              },
            })
            .mount("#customCard-container")
        );
      }
      setLoading(false);
    }
  }, [checkout, total]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      textAlign="center"
      justifyContent="center"
    >
      <Container maxWidth="md">
        {loading ? (
          <Loader loading={loading} />
        ) : (
          <div className="form-card" id="customCard-container"></div>
        )}
      </Container>
    </Box>
  );
};

Checkout.layout = "Blank";
export default Checkout;
