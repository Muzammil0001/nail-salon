import SubscriptionListing from "@/components/subscription/SubscriptionListing";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Subscriptions = () => {
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session && !session?.user?.roles?.includes("SuperAdmin")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <div>
      {session && session?.user?.roles?.includes("SuperAdmin") && (
        <SubscriptionListing />
      )}
    </div>
  );
};

export default Subscriptions;
