import GiftCardListing from "@/components/gift-cards/GiftCardListing";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

const GiftCardsPage = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/benefits/gift-cards")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <div>
      {session && session?.user?.navigation?.includes("/admin/benefits/gift-cards") && (
        <GiftCardListing />
      )}
    </div>
  );
};

export default GiftCardsPage;
