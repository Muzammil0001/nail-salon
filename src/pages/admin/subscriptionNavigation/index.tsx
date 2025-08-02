import axios from "axios";
import React, { useEffect, useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import { useFormik } from "formik";
import CustomFormButton from "@/components/forms/theme-elements/CustomFormButton";
import PageContainer from "@/components/container/PageContainer";
import Loader from "@/components/loader/Loader";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { t } from "../../../../lib/translationHelper";
import { useSelector } from "@/store/Store";
interface SubscriptionNavigation {
  navigation_id: number;
  subscription_id: number;
}

interface Subscription {
  id: number;
  name: string;
  description: string;
}

interface Navigation {
  id: number;
  title: string;
  href: string;
}

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [navigation, setNavigation] = useState<Navigation[]>([]);
  const [
    savedSubscriptionNavigation,
    setSavedSubscriptionNavigation,
  ] = useState<SubscriptionNavigation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

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
    const fetchSubscriptions = async () => {
      try {
        const response = await axios.post(
          "/api/subscriptionnavigation/getsubscriptions"
        );
        setSubscriptions(response.data.subscriptions || []);
      } catch (error) {
        ToastErrorMessage(error);
        setSubscriptions([]);
      }
    };
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const response = await axios.post(
          "/api/navigations/getnaviagationsforsubscription"
        );
        setNavigation(response.data.navigations || []);
      } catch (error) {
        ToastErrorMessage(error);
        setNavigation([]);
      }
    };
    fetchNavigation();
  }, []);

  useEffect(() => {
    const fetchSavedSubscriptionNavigation = async () => {
      try {
        const response = await axios.post(
          "/api/subscriptionnavigation/getsubscriptionnavigation"
        );
        setSavedSubscriptionNavigation(
          response.data.subscription_navigation || []
        );
      } catch (error) {
        ToastErrorMessage(error);
        setSavedSubscriptionNavigation([]);
      }
    };
    fetchSavedSubscriptionNavigation();
  }, []);

  const formik = useFormik({
    initialValues: {
      subscription_navigation: savedSubscriptionNavigation,
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        console.log("Submitting subscription_navigation values:", values);
        const response = await axios.post(
          "/api/subscriptionnavigation/createsubscriptionnavigation",
          {
            subscription_navigation: values.subscription_navigation,
          }
        );
        ToastSuccessMessage(response?.data?.message || "updated!");
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleCheckboxChange = (
    navigationId: number,
    subscriptionId: number
  ) => {
    const isChecked = formik.values.subscription_navigation.some(
      (item) =>
        item.navigation_id === navigationId &&
        item.subscription_id === subscriptionId
    );

    if (isChecked) {
      formik.setFieldValue(
        "subscription_navigation",
        formik.values.subscription_navigation.filter(
          (item) =>
            !(
              item.navigation_id === navigationId &&
              item.subscription_id === subscriptionId
            )
        )
      );
    } else {
      formik.setFieldValue("subscription_navigation", [
        ...formik.values.subscription_navigation,
        { navigation_id: navigationId, subscription_id: subscriptionId },
      ]);
    }
  };
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session && !session?.user?.roles?.includes("SuperAdmin")) {
      router.push("/admin/login");
    }
  }, [session]);

  return (
    <PageContainer topbar={<div></div>}>
      <Loader loading={isLoading} />
      <form onSubmit={formik.handleSubmit}>
        <table className="table-auto w-full border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="w-[10%] px-4 py-4 border text-left">{t("navigation", keys)}</th>
              {subscriptions.map((subscription) => (
                <th key={subscription.id} className="w-[10%] px-4 py-4 border capitalize">
                  {t(subscription.name, keys)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {navigation.map((nav) => (
              <tr key={nav.id}>
                <td className="border px-4 py-4">{t(nav.title, keys)}</td>
                {subscriptions.map((subscription) => {
                  return (
                    <td
                      key={subscription.id}
                      className="border px-4 py-4 text-center"
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formik.values.subscription_navigation.some(
                              (entry) =>
                                entry.navigation_id === nav.id &&
                                entry.subscription_id === subscription.id
                            )}
                            onChange={() =>
                              handleCheckboxChange(nav.id, subscription.id)
                            }
                            name={`subscription_navigation.${nav.id}.${subscription.id}`}
                            color="primary"
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
          <CustomFormButton type="submit" variant="contained" color="primary">
            {t("save_changes", keys)}
          </CustomFormButton>
        </div>
      </form>
    </PageContainer>
  );
};

export default SubscriptionManagement;
