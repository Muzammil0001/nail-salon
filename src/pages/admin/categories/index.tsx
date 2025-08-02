import CategoriesListing from "@/components/categories/CategoriesListing";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";

const Categories = () => {
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/categories")) {
      router.push("/admin/login");
    }
  }, [session]);
  return (
    <div>
      {session && session?.user?.navigation?.includes("/admin/categories") && (
        <CategoriesListing />
      )}
    </div>
  );
};

export default Categories;
