import { useState, useEffect } from "react";
import Head from "next/head";
import { AppProps } from "next/app";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { LoadScript } from "@react-google-maps/api";
import { Provider } from "react-redux";
import "../styles/globals.css";
import { I18nextProvider } from "react-i18next";
import { SessionProvider } from "next-auth/react";
import createEmotionCache from "@/createEmotionCache";
import BlankLayout from "@/layouts/blank/BlankLayout";
import { ThemeSettings } from "@/theme/Theme";
import store, { AppState, useSelector } from "@/store/Store";
import FullLayout from "@/layouts/full/FullLayout";
import { AlertInterface } from "@/types/admin/types";
import Toast from "@/components/toast/Toast";
import RTL from "@/layouts/full/shared/customizer/RTL";
import i18n from "@/i18n";
import { TailwindProvider } from "@/components/providers/TailwindProvider";
import { QueryClient, QueryClientProvider } from "react-query";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import FirebaseProvider from "@/components/providers/FirebaseProvider";
const clientSideEmotionCache = createEmotionCache();
import { Toaster } from "sonner";
import { initOneSignal } from "../../lib/onesignal";

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const layouts: any = {
  Blank: BlankLayout,
};

const queryClient = new QueryClient();

const MyApp = (props: MyAppProps) => {
  const {
    Component,
    emotionCache = clientSideEmotionCache,
    pageProps,
  }: any = props;
  const theme = ThemeSettings();
  const customizer = useSelector((state: AppState) => state.customizer);
  const Layout = layouts[Component.layout] || FullLayout;

  const toast: AlertInterface = {
    description: "",
    open: false,
    title: "",
    callback(): void {},
  };

  // useEffect(() => {
  //   initOneSignal();
  // }, []);

  return (
    <>
      <CacheProvider value={emotionCache}>
        <Toaster
          position="top-right"
          richColors
          expand={true}
          toastOptions={{
            unstyled: true,
            style: {
              background: "#ffffff",
              display: "flex",
              gap: "4px",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 10px",
              borderRadius: "5px",
              right: 0,
              top: 0,
            },
            classNames: { cancelButton: "bg-white", closeButton: "bg-white" },
          }}
        />
        <ThemeProvider theme={theme}>
          <TailwindProvider>
            <Head>
              <meta
                name="viewport"
                content="initial-scale=1, width=device-width"
              />
              <title>{process.env.NEXT_PUBLIC_APP}</title>
            </Head>
            <RTL direction={customizer.activeDir}>
              <CssBaseline />
              <SessionProvider
                session={pageProps.session}
                refetchInterval={5 * 60}
                refetchOnWindowFocus={true}
              >
                <QueryClientProvider client={queryClient}>
                  <Layout>
                    <LoadScript
                      libraries={["places"]}
                      googleMapsApiKey={
                        process.env.NEXT_PUBLIC_GOOGLE_MAP_API as string
                      }
                    >
                      <Toast toast={toast} />

                      <I18nextProvider i18n={i18n}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <FirebaseProvider>
                            <Component {...pageProps} />
                          </FirebaseProvider>
                        </LocalizationProvider>
                      </I18nextProvider>
                    </LoadScript>
                  </Layout>
                </QueryClientProvider>
              </SessionProvider>
            </RTL>
          </TailwindProvider>
        </ThemeProvider>
      </CacheProvider>
    </>
  );
};

export default (props: MyAppProps) => (
  <Provider store={store}>
    <MyApp {...props} />
  </Provider>
);
