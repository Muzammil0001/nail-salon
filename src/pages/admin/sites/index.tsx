import SitesListing from "@/components/sites/SitesListing";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

const LocationsOverview = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (
      session &&
      !session?.user?.navigation?.includes("/admin/sites")
    ) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <div>
      {session &&
        session?.user?.navigation?.includes("/admin/sites") && (
          <SitesListing />
        )}
    </div>
  );
};

export default LocationsOverview;
