import ServiceListing from "@/components/services/ServicesListing";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";

const Products = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/services")) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <div>
      {session && session?.user?.navigation?.includes("/admin/services") && (
        <ServiceListing session={session} />
      )}
    </div>
  );
};

export default Products;
