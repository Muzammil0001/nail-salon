import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/container/PageContainer";
import Packages from "@/components/plan/packages";
import { useEffect } from "react";

type TicketListProps = {
  features: any;
  subscriptions: any;
};

const TicketList: React.FC<TicketListProps> = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/plans")) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <PageContainer topbar={<></>}>
      {session && session?.user?.navigation?.includes("/admin/plans") ? (
        <Packages session={session} />
      ) : null}
    </PageContainer>
  );
};

export default TicketList;
