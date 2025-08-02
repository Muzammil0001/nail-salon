import TranslationListing from "@/components/app-translation/TranslationListing";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

const index = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/app-translation")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <div>
      {session && session?.user?.navigation?.includes("/admin/app-translation") && (
        <TranslationListing />
      )}
    </div>
  );
};

export default index;
