import PageContainer from "../../../../src/components/container/PageContainer";
import { useRouter } from "next/router";
import {  useSession } from "next-auth/react";
import AppVersionListing from "../../../../src/components/appversions/AppVersionListing";
import { useEffect } from "react";

const AppVersion = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/appversions")) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <PageContainer>
      {session && session?.user?.navigation?.includes("/admin/appversions") && (
        <AppVersionListing />
      )}
    </PageContainer>
  );
};

export default AppVersion;
