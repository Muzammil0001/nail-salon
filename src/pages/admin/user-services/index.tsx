import UserServices from "@/components/user-services";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

const Users = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/user-services")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <div>
      {session && session?.user?.navigation?.includes("/admin/user-services") && (
        <UserServices session={session}/>
      )}
    </div>
  );
};

export default Users;
