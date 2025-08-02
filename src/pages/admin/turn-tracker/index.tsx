import TurnsTacker from "@/components/turn-tracker";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

const Users = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/turn-tracker")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <div>
      {session && session?.user?.navigation?.includes("/admin/turn-tracker") && (
        <TurnsTacker session={session} />
      )}
    </div>
  );
};

export default Users;
