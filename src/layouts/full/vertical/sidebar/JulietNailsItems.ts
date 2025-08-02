import { uniqueId } from "lodash";
interface MenuitemsType {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
}
import {
  IconTemplate,
  IconPointFilled,
  IconListDetails,
  IconBusinessplan,
  IconSettingsCog,
  IconVersions,
  IconSettings,
  IconMapPinFilled,
  IconBuilding,
  IconNavigationCog,
  IconLayoutBoard,
  IconBellRinging,
  IconReceipt,
  IconLanguage,
  IconBox,
  IconUser,
  IconChartBarPopular,
  IconVideo,
  IconFileChart,
} from "@tabler/icons-react";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import WidgetsIcon from "@mui/icons-material/Widgets";
import StarsIcon from '@mui/icons-material/Stars';
import RoomServiceIcon from "@mui/icons-material/RoomService";
import CalculateIcon from "@mui/icons-material/Calculate";
const Menuitems: MenuitemsType[] = [
  {
    id: uniqueId(),
    title: "dashboard",
    icon: IconLayoutBoard,
    href: "/admin/dashboard",
  },
  {
    id: uniqueId(),
    title: "locations",
    icon: IconMapPinFilled,
    href: "#",
    children: [
      {
        id: uniqueId(),
        title: "overview",
        icon: IconPointFilled,
        href: "/admin/locations-overview",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "clients",
    icon: IconUser,
    href: "/admin/clients",
  },
  {
    id: uniqueId(),
    title: "location",
    icon: IconListDetails,
    href: "#",
    children: [
      {
        id: uniqueId(),
        title: "appointments",
        icon: IconPointFilled,
        href: "/admin/appointments",
      },
      {
        id: uniqueId(),
        title: "orders",
        href: "/admin/orders",
        icon: IconPointFilled,
      },
      {
        id: uniqueId(),
        title: "customers",
        icon: IconPointFilled,
        href: "/admin/customers",
      },
    ],
  },

  {
    id: uniqueId(),
    title: "services",
    icon: WidgetsIcon,
    href: "#",
    children: [
      {
        id: uniqueId(),
        title: "categories",
        icon: IconPointFilled,
        href: "/admin/categories",
      },
      {
        id: uniqueId(),
        title: "services",
        icon: IconPointFilled,
        href: "/admin/services",
      },
    ],
  },

  // {
  //   id: uniqueId(),
  //   title: "call_staff",
  //   icon: RoomServiceIcon,
  //   href: "#",
  //   children: [
  //     {
  //       id: uniqueId(),
  //       title: "service_management",
  //       icon: IconPointFilled,
  //       href: "/admin/service-management",
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "active_requests",
  //       icon: IconPointFilled,
  //       href: "/admin/active-requests",
  //     },
  //   ],
  // },
  // {
  //   id: uniqueId(),
  //   title: "orders",
  //   icon: IconBellRinging,
  //   href: "/admin/orders",
  // },
  {
    id: uniqueId(),
    title: "my_salon",
    icon: IconTemplate,
    href: "#",
    children: [
      {
        id: uniqueId(),
        title: "devices",
        icon: IconPointFilled,
        href: "/admin/devices",
      },
      {
        id: uniqueId(),
        title: "users",
        icon: IconPointFilled,
        href: "/admin/users",
      },
      {
        id: uniqueId(),
        title: "turn_tracker",
        icon: IconPointFilled,
        href: "/admin/turn-tracker",
      },
      {
        id: uniqueId(),
        icon: IconPointFilled,
        title: "user_services",
        href: "/admin/user-services",
      },
      // {
      //   id: uniqueId(),
      //   title: "scheduling",
      //   icon: IconPointFilled,
      //   href: "/admin/scheduling",
      // },
      // {
      //   id: uniqueId(),
      //   title: "shift_management",
      //   icon: IconPointFilled,
      //   href: "/admin/shift-management",
      // },
      // {
      //   id: uniqueId(),
      //   title: "plans",
      //   icon: IconPointFilled,
      //   href: "/admin/plans",
      // },
      {
        id: uniqueId(),
        title: "all_users",
        icon: IconPointFilled,
        href: "/admin/all_user",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "sites",
    icon: IconBuilding,
    href: "/admin/sites",
  },
  // {
  //   id: uniqueId(),
  //   title: "app_settings",
  //   icon: IconSettings,
  //   href: "#",
  //   children: [
  //     {
  //       id: uniqueId(),
  //       title: "staff_app",
  //       icon: IconPointFilled,
  //       href: "/admin/staffapp",
  //     },
  // {
  //   id: uniqueId(),
  //   title: "printer",
  //   icon: IconPointFilled,
  //   href: "/admin/printer-settings",
  // },
  //   ],
  // },
  {
    id: uniqueId(),
    title: "subscription",
    icon: IconBusinessplan,
    href: "/admin/subscription",
  },
  {
    id: uniqueId(),
    title: "navigation_management",
    icon: IconNavigationCog,
    href: "#",
    children: [
      {
        id: uniqueId(),
        title: "role_management",
        icon: IconPointFilled,
        href: "/admin/roles",
      },
      {
        id: uniqueId(),
        title: "subscription_management",
        icon: IconPointFilled,
        href: "/admin/subscriptionNavigation",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "benefits",
    icon: StarsIcon,
    href: "#",
    children: [
      {
        id: uniqueId(),
        title: "gift_cards",
        icon: IconPointFilled,
        href: "/admin/benefits/gift-cards",
      },
      {
        id: uniqueId(),
        title: "loyalty",
        href: "/admin/loyalty",
        icon: IconPointFilled,
      },
    ],
  },
  {
    id: uniqueId(),
    title: "payroll",
    icon: CalculateIcon,
    href: "/admin/payroll",
  },
  // {
  //   id: uniqueId(),
  //   title: "configuration",
  //   icon: IconSettingsCog,
  //   href: "/admin/configuration",
  // },
  // {
  //   id: uniqueId(),
  //   title: "app_versions",
  //   icon: IconVersions,
  //   href: "/admin/appversions",
  // },
  // {
  //   id: uniqueId(),
  //   title: "receipt_templates",
  //   icon: IconReceipt,
  //   href: "/admin/receipt-templates",
  // },
  {
    id: uniqueId(),
    title: "admin_translations",
    icon: IconLanguage,
    href: "/admin/app-translation",
  },
  {
    id: uniqueId(),
    title: "activity_logs",
    href: "/admin/activity-logs",
    icon: IconFileChart,
  },
];
export default Menuitems;
