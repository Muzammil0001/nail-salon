import axios from "axios";
import React, { useEffect, useState } from "react";
import { Checkbox, CircularProgress, FormControlLabel } from "@mui/material";
import { useFormik } from "formik";
import CustomFormButton from "@/components/forms/theme-elements/CustomFormButton";
import PageContainer from "@/components/container/PageContainer";
import Loader from "@/components/loader/Loader";
import { useTranslation } from "react-i18next";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { t } from "../../../../lib/translationHelper";
import { useSelector } from "@/store/Store";

interface RoleNavigation {
  navigation_id: number;
  role_id: number;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface Navigation {
  id: number;
  title: string;
  href: string;
}

const RoleManagement = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [navigation, setNavigation] = useState<Navigation[]>([]);
  const [savedRoleNavigation, setSavedRoleNavigation] = useState<
    RoleNavigation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "sidebar" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      }
    })();
  }, [languageUpdate]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.post("/api/roles/getroles");
        setRoles(response.data.roles || []);
      } catch (error) {
        ToastErrorMessage(error);
        setRoles([]);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const response = await axios.post("/api/roles/getnaviagtions");
        setNavigation(response.data.navigations || []);
      } catch (error) {
        ToastErrorMessage(error);
        setNavigation([]);
      }
    };
    fetchNavigation();
  }, []);

  useEffect(() => {
    const fetchSavedRoleNavigation = async () => {
      try {
        const response = await axios.post("/api/roles/getrolenavigation");
        setSavedRoleNavigation(response.data.role_navigation || []);
      } catch (error) {
        ToastErrorMessage(error);
        setSavedRoleNavigation([]);
      }
    };
    fetchSavedRoleNavigation();
  }, []);

  const formik = useFormik({
    initialValues: {
      role_navigation: savedRoleNavigation,
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const response = await axios.post("/api/roles/createroles", {
          role_navigation: values.role_navigation,
        });
        ToastSuccessMessage(response?.data?.message || "updated!");
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleCheckboxChange = (navigationId: number, roleId: number) => {
    const isChecked = formik.values.role_navigation.some(
      (item) => item.navigation_id === navigationId && item.role_id === roleId
    );

    if (isChecked) {
      formik.setFieldValue(
        "role_navigation",
        formik.values.role_navigation.filter(
          (item) =>
            !(item.navigation_id === navigationId && item.role_id === roleId)
        )
      );
    } else {
      formik.setFieldValue("role_navigation", [
        ...formik.values.role_navigation,
        { navigation_id: navigationId, role_id: roleId },
      ]);
    }
  };

  const superNavs = [
    "/admin/configuration",
    "/admin/all_user",
    "/admin/roles",
    "/admin/subscriptionNavigation",
    "/admin/announcements",
    "/admin/subscription",
    "/admin/clients",
    "/admin/appversions",
    "/admin/app-translation",
    "/admin/item-admin",
    "/admin/supplier-admin",
    "/admin/tutorials",
  ];
  const alwaysInclude = ["/admin/receipts"];
  const router = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
  });
  useEffect(() => {
    if (session && !session?.user?.navigation?.includes("/admin/roles")) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <>
      {session && session?.user?.navigation?.includes("/admin/roles") && (
        <PageContainer topbar={<div></div>}>
          <Loader loading={isLoading} />
          <form onSubmit={formik.handleSubmit}>
            <table className="table-auto w-full border-collapse border border-gray-200">
              <thead>
                <tr>
                  <th className="w-[10%] px-4 py-4 border">Navigation</th>
                  {roles.map((role) => (
                    <th key={role.id} className="w-[10%] px-4 py-4 border">
                      {t(role.name.toLowerCase().replace(/\s+/g, '_'), keys)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {navigation.map((nav) => (
                  <tr key={nav.id}>
                    <td className="border px-4 py-4">{t(nav?.title, keys)}</td>
                    {roles.map((role) => {
                      return (
                        <td
                          key={role.id}
                          className="border px-4 py-4 text-center"
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formik.values.role_navigation.some(
                                  (entry) =>
                                    entry.navigation_id === nav.id &&
                                    entry.role_id === role.id
                                )}
                                onChange={() =>
                                  handleCheckboxChange(nav.id, role.id)
                                }
                                name={`role_navigation.${nav.id}.${role.id}`}
                                color="primary"
                                disabled={
                                  [
                                    "/admin/roles",
                                    "/admin/subscriptionNavigation",
                                  ].includes(nav.href) ||
                                  (role.name !== "SuperAdmin" &&
                                    superNavs.includes(nav.href) &&
                                    !alwaysInclude.includes(nav.href)) ||
                                  (role.name === "SuperAdmin" &&
                                    !superNavs.includes(nav.href) &&
                                    !alwaysInclude.includes(nav.href))
                                }
                              />
                            }
                            label=""
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end me-[2%]">
              <CustomFormButton
                type="submit"
                variant="contained"
                color="primary"
              >
                Save Changes
              </CustomFormButton>
            </div>
          </form>
        </PageContainer>
      )}
    </>
  );
};

export default RoleManagement;
