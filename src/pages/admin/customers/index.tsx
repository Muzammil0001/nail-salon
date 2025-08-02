import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import CustomersListing from "@/components/customers/CustomersListing";

const Customers = () => {
  const { data: session, status }: any = useSession({ required: true });
  const router = useRouter();

  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/customers")) {
      router.push("/admin/login");
    }
  }, [session]);
  return <CustomersListing session={session} />;
};

export default Customers;
