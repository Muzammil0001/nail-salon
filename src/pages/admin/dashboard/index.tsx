import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

import { Dashboard } from "@/components/dashboard/Dashboard";
import Head from "next/head";

const DashboardSection = () => {
  const { data: session, status }: any = useSession();
  console.log(session);
  // useEffect(() => {
  //   if (session && !session?.user?.navigation?.includes("/admin/dashboard")) {
  //     signOut();
  //   }
  // }, [session]);

  return (
    <div>
      <Head>
        <title>Dashboard | Juliet Nails</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      { (
        <Dashboard session={session} />
      )}
    </div>
  );
};

export default DashboardSection;
