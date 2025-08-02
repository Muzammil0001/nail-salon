import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid2";
import PageContainer from "@/components/container/PageContainer";
import { SalesPerStaff } from "./SalesPerStaffMember";
import { TipsPerStaffMember } from "./TipsPerStaffMember";
import { ToastErrorMessage } from "../common/ToastMessages";
import axios from "axios";
import Loader from "../loader/Loader";
import { SalesPerServices } from "./SalesPerServices";
import { useSelector } from "@/store/Store";
import { useTheme } from "@mui/material";
import AccessDenied from "../NoAccessPage";
import { AccessRights2 } from "@/types/admin/types";
import { checkAccess } from "../../../lib/clientExtras";
export const Dashboard = ({ session }: { session: any }) => {
  const [loading, setLoading] = useState(false);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState([]);
  const [data, setData] = useState({
    waiters: [],
    layouts: [],
    sectors: [],
    tables: [],
    sections: [],
    categories: [],
    products: [],
    items: [],
    address: "",
    paymentMethods: [
      {
        name: "cash",
        value: "CASH",
      },
      {
        name: "card",
        value: "CARD",
      },
      {
        name: "other",
        value: "OTHER",
      },
    ],
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/dashboard/fetchdata");
        setData((prev) => ({
          ...prev,
          ...response.data,
        }));
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "dashboard" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const theme = useTheme();

  return (
    <>
      {( (session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/orders")) || ((session?.user?.roles?.includes("BackOfficeUser")) &&
          checkAccess(
            session.user.accessrights?.controls as AccessRights2,
            "/admin/dashboard",
            "view"
          ))
      ) ? (<PageContainer
        topbar={<></>}
        css={{ backgroundColor: theme.palette.info.light }}
      >
        <Loader loading={loading} />

        <Grid container spacing={1} alignItems="stretch">
          <Grid
            size={{ lg: 12, xl: 6 }}
            className="bg-background-paper p-4 rounded-lg"
          >
            <SalesPerStaff
              session={session}
              keys={keys}
              data={data}
              loading={loading}
              setLoading={setLoading}
            />
          </Grid>
          {/* <Grid
          size={{ lg: 12, xl: 3 }}
          className="bg-background-paper p-4 rounded-lg"
        >
          <ProftLossAnalysis
            session={session}
            keys={keys}
            data={data}
            loading={loading}
            setLoading={setLoading}
          />
        </Grid> */}

          <Grid
            size={{ lg: 12, xl: 6 }}
            className="bg-background-paper p-4 rounded-lg"
          >
            <TipsPerStaffMember
              session={session}
              keys={keys}
              data={data}
              loading={loading}
              setLoading={setLoading}
            />
          </Grid>
          <Grid
            size={{ lg: 12, xl: 6 }}
            className="bg-background-paper p-4 rounded-lg"
          >
            <SalesPerServices
              session={session}
              keys={keys}
              data={data}
              loading={loading}
              setLoading={setLoading}
            />
          </Grid>
        </Grid>
      </PageContainer>) : (<AccessDenied />)}
    </>
  );
};
