"use client";
import { initializeApp } from "firebase/app";
import { useEffect, useState } from "react";
import { getMessaging } from "firebase/messaging/sw";
import { getToken } from "@firebase/messaging";
import axios from "axios";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "@/store/Store";
import { setHasNotify } from "@/store/NotifySlice";
import {
  ToastErrorMessage,
  ToastSuccessMessage,
} from "../common/ToastMessages";
import { useTranslationWatcher } from "../common/useTranslationWatcher";
export default function FirebaseProvider({ children }: any) {
  const dispatch = useDispatch();
  useTranslationWatcher();
  const { data: session }: any = useSession();
  const firebaseApp = initializeApp({
    apiKey: "AIzaSyD-4UYndipWc68y8e35Oed9b4mO-Kn82aA",
    authDomain: "orby-pos.firebaseapp.com",
    projectId: "orby-pos",
    storageBucket: "orby-pos.firebasestorage.app",
    messagingSenderId: "860126635364",
    appId: "1:860126635364:web:5063288942aca3155dc671",
    measurementId: "G-P4C4FQ78VK",
  });
  const [open, setOpen] = useState(false);
  const firebaseRequest = async () => {
    setOpen(false);

    if (typeof window !== "undefined") {
      const messaging = getMessaging(firebaseApp);
      if (session && !session?.user?.roles?.includes("SuperAdmin")) {
        await navigator.serviceWorker
          .register("/images/firebase-messaging-sw.js")
          .then((registration: ServiceWorkerRegistration) => {
            getToken(messaging, {
              vapidKey:
                "BE4v5qNwtamNnlsntOKCAql1_8-eO9qXxaIs7mCdgchXcQOV4XPh5hPXh8yMbE1J1DdUiMNJSLwMdDeMPpA3EL4",
              serviceWorkerRegistration: registration,
            })
              .then((currentToken) => {
                const token = localStorage.getItem("token");
                localStorage.setItem("permission", "Y");
                localStorage.setItem("token", currentToken);
                if (
                  (session?.user?.roles?.includes("Owner") ||
                    session?.user?.roles?.includes("BackOfficeUser")) &&
                  session.user?.selected_location_id
                ) {
                  const isSubscribed = localStorage.getItem("isSubscribed");
                  if (isSubscribed) {
                    if (isSubscribed == "Y" && currentToken != token) {
                      try {
                        axios.post("/api/firebase/subscribetotopic", {
                          token: currentToken,
                          topic: `${process.env.NEXT_PUBLIC_URL}-${session.user?.selected_location_id}`,
                        });
                        localStorage.setItem("isSubscribed", "Y");
                      } catch (error) {
                        ToastErrorMessage(error);
                      }
                    }
                  } else {
                    try {
                      axios.post("/api/firebase/subscribetotopic", {
                        token: currentToken,
                        topic: `${process.env.NEXT_PUBLIC_URL}-${session.user?.selected_location_id}`,
                      });
                      localStorage.setItem("isSubscribed", "Y");
                    } catch (error) {
                      ToastErrorMessage(error);
                    }
                  }
                }
              })
              .catch((err) => {});
          });
        if ("serviceWorker" in navigator) {
          localStorage.setItem("isRegistered", "Y");
          navigator.serviceWorker.addEventListener("message", (event) => {
            console.log(event.data, "event");
            if (event.data.data) {
              if (
                event.data.data.messageType &&
                event.data.data.messageType === "RESERVATION"
              ) {
                ToastSuccessMessage("New Reservation Booked!");
              } else if (
                event.data.data.messageType &&
                event.data.data.messageType === "ORDER"
              ) {
                ToastSuccessMessage("New Order Placed!");
              } else if (
                event.data.data.messageType &&
                event.data.data.messageType === "REQUEST"
              ) {
                ToastSuccessMessage("New Service Request Received!");
              }
              dispatch(setHasNotify(false));
              setTimeout(() => dispatch(setHasNotify(true)), 0);

              playSound();
            }
          });
        }
      }
    }
  };

  const playSound = () => {
    const audio = new Audio("/sound/bell.wav");
    audio.play();
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.Notification?.permission == "granted") {
        firebaseRequest();
      } else if (window.Notification?.permission === "denied") {
      } else {
        const permission = localStorage.getItem("permission");
        if (!permission) {
          if (session && !session?.user?.roles?.includes("SuperAdmin")) {
            firebaseRequest();
          }
        }
      }
    }
  }, [session]);
  return (
    <>
      {children}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth={true}
      >
        <DialogTitle>Notification Request</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: "3rem" }}
        >
          <Typography variant="h6">
            The app needs your permission to enable push notifications.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ pb: 3, pr: 3 }}>
          <Button onClick={firebaseRequest} variant="contained">
            Allow
          </Button>
          <Button onClick={() => setOpen(false)} variant="outlined">
            Deny
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
