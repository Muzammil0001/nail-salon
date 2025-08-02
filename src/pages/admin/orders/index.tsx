import { useSession } from "next-auth/react";
import OrderListing from "../../../components/orders/OrderListing";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Order = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/orders")) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <div>
      {session && session?.user?.navigation?.includes("/admin/orders") && (
        <OrderListing session={session} />
      )}
    </div>
  );
};

export default Order;
