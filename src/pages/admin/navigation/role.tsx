import { Box, Typography } from "@mui/material";

import Head from "next/head";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import PageContainer from "@/components/container/PageContainer";
import RestrictionPage from "@/components/roleRestriction/restrictionPage";

const Role_Management = () => {
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
          <Typography>{t("role_management")}</Typography>
        </Head>
        <RestrictionPage />
      </Box>
    </PageContainer>
  );
};

export default Role_Management;
