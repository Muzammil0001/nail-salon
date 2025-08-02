import { Box } from "@mui/material";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import PageContainer from "@/components/container/PageContainer";
import SubscriptionPage from "@/components/subscriptionManagement/subscriptionPage";

const Subscription = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/admin/login");
    },
  });
  useEffect(() => {
    if (session && !session?.user?.roles?.includes("SuperAdmin")) {
      router.push("/admin/dashboard");
    }
  }, [session]);
  const { t } = useTranslation();
  return (
    <PageContainer>
      <Box>
        <Head>
          <title>{t("subscription_management")}</title>
        </Head>
        <SubscriptionPage />
      </Box>
    </PageContainer>
  );
};

export default Subscription;
