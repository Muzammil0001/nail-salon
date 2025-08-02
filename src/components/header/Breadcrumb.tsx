import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Box, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import breadcrumbsConfig from "../../../lib/breadcrumbs.json";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import WidgetsIcon from '@mui/icons-material/Widgets';
import {
  IconLibraryPhoto,
  IconMapPinFilled,
  IconUserFilled,
  IconUserPin,
} from "@tabler/icons-react";
import { IconSettingsCog } from "@tabler/icons-react";
import { IconVersions } from "@tabler/icons-react";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import { IconSpeakerphone } from "@tabler/icons-react";
import { IconBusinessplan } from "@tabler/icons-react";
import { IconBuilding } from "@tabler/icons-react";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { IconLanguage } from "@tabler/icons-react";
import axios from "axios";
import { t } from "../../../lib/translationHelper";
import { ToastErrorMessage } from "../common/ToastMessages";
import { useSelector } from "@/store/Store";
import CalculateIcon from "@mui/icons-material/Calculate";
// import {t} from "i18next"
// Define the type for the breadcrumb configuration
interface BreadcrumbConfig {
  [key: string]: {
    title?: string;
    content?: string;
    icon?: keyof typeof iconMap; // Icon key must match keys in `iconMap`
    parent?: string;
    queries?: {
      [queryKey: string]: {
        title: string;
        content: string;
        icon?: keyof typeof iconMap;
      };
    };
  };
}
// Assert the type of the JSON configuration
const breadcrumbs = (breadcrumbsConfig as unknown) as BreadcrumbConfig;
// Map icon names from JSON to Material-UI icons
const iconMap = {
  Home: <HomeIcon />,
  company: <BusinessIcon />,
  location: <LocationOnIcon />,
  dashboard: <DashboardIcon />,
  menu: <WidgetsIcon />,
  person: <PersonIcon />,
  IconUserPin: <IconUserPin />,
  IconSettingsCog: <IconSettingsCog />,
  IconVersions: <IconVersions />,
  CardMembershipIcon: <CardMembershipIcon />,
  IconSpeakerphone: <IconSpeakerphone />,
  IconBusinessplan: <IconBusinessplan />,
  IconBuilding: <IconBuilding />,
  IconUserFilled: <IconUserFilled />,
  SupportAgentIcon: <SupportAgentIcon />,
  language: <IconLanguage />,
  IconLibraryPhoto: <IconLibraryPhoto />,
  IconMapPinFilled: <IconMapPinFilled />,
  CalculateIcon: <CalculateIcon />
};
const Breadcrumb: React.FC = () => {
  const router = useRouter();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const { pathname, query } = router;
  // Function to match query keys from the JSON
  const findMatchingQuery = (
    queries: BreadcrumbConfig[string]["queries"],
    currentQuery: typeof query
  ) => {
    if (!queries) return null;
    for (const queryKey in queries) {
      const queryPairs = queryKey.split("=").map((pair) => pair.trim());
      const [queryParam, queryValue] = queryPairs;
      if (currentQuery[queryParam] === queryValue) {
        return queries[queryKey];
      }
    }
    return null;
  };
  // Recursive function to build breadcrumb hierarchy
  const getBreadcrumbs = (
    path: string
  ): Array<{
    label: string;
    content: string;
    icon?: React.ReactNode;
    path: string;
  }> => {
    const breadcrumbData = breadcrumbs[path];
    if (!breadcrumbData) return [];
    const parentBreadcrumbs = breadcrumbData.parent
      ? getBreadcrumbs(breadcrumbData.parent)
      : [];
    // Default breadcrumb for the path
    let dynamicBreadcrumb = {
      label: breadcrumbData.title || "",
      content: breadcrumbData.content || "",
      icon: breadcrumbData.icon ? iconMap[breadcrumbData.icon] : undefined,
      path,
    };
    // Check if there are query-specific overrides
    const queryMatch = findMatchingQuery(breadcrumbData.queries, query);
    if (queryMatch) {
      dynamicBreadcrumb = {
        label: queryMatch.title,
        content: queryMatch.content,
        icon: queryMatch.icon
          ? iconMap[queryMatch.icon]
          : dynamicBreadcrumb.icon,
        path,
      };
    }
    // Skip adding breadcrumb if neither default nor query-specific data exists
    if (!dynamicBreadcrumb.label && !dynamicBreadcrumb.content) {
      return parentBreadcrumbs;
    }
    return [...parentBreadcrumbs, dynamicBreadcrumb];
  };
  const breadcrumbTrail = getBreadcrumbs(pathname);
  // Extract title for the last breadcrumb in the trail
  const lastBreadcrumb = breadcrumbTrail[breadcrumbTrail.length - 1] || {};
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "Breadcrumb" }
        );
        setKeys(response.data);
      } catch (error) {
        ToastErrorMessage(error);
      }
    })();
  }, [languageUpdate]);
  return (
    <Box>
      {/* Title Outside the White Box */}
      <div className="flex items-start flex-col m-1 lg:m-0 lg:items-center lg:flex-row gap-4">
        <Box>
          <Typography variant="h5" color="white" className="capitalize">
            {t(lastBreadcrumb.label, keys)}
            {/* {t(lastBreadcrumb.label)} */}
          </Typography>
        </Box>
        {/* Breadcrumbs Inside the White Box */}
        <Box
          sx={{
            backgroundColor: "background.paper",
            padding: "12px",
            borderRadius: "8px",
            display: "flex",
            gap: 2,
            alignItems: "center",
          }}
        >
          {breadcrumbTrail.map((crumb, index) => (
            <Box
              key={crumb.path}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <div className="text-primary-main">
                {crumb.icon && <Box>{crumb.icon}</Box>}
              </div>
              <Typography className="capitalize">
                {t(crumb.content, keys)}
              </Typography>
              {/* <Typography>{t(crumb.content)}</Typography> */}
            </Box>
          ))}
        </Box>
      </div>
    </Box>
  );
};
export default Breadcrumb;
