import React from "react";
import { IconPointFilled, IconSettings, IconMapPinFilled, IconBuilding, IconTemplate, IconAperture } from "@tabler/icons-react";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";

const getIcon = (iconName: string, css:string) => {

  switch (iconName.toLowerCase()) {
    case "app settings":
    case "setting":
    case "settings":
      return <IconSettings className={`${css}`}/>;
    case "dashboard":
      return <img src="/images/svgs/dashboard-icon.svg" alt="" className={`${css} !text-gray-600`} />;
    case "notifications":
      return <IconTemplate   className={`${css}`} />;
    case "color":
    case "colors":
      return <IconAperture   className={`${css}`} />;
    case "kitchen bar":
      return <RoomServiceIcon className={`${css}`} />;
    case "main pos":
      return <IconMapPinFilled className={`${css}`}/>;
    case "location":
      return <IconMapPinFilled className={`${css}`}/>;
    case "company":
      return <img src="/images/svgs/company-building-icon.svg" alt="" className={`${css} !text-gray-600`} />;
    case "clients":
      return <img src="/images/svgs/company-building-icon.svg" alt="" className={`${css} !text-gray-600`} />;
    case "restuarent":
      return <img src="/images/svgs/company-building-icon.svg" alt="" className={`${css} !text-gray-600`} />;
    case "account management":
      return <ManageAccountsOutlinedIcon className={`${css}`} />;
    default:
      return <IconPointFilled className={`${css} !size-3`} />;
  }
};

export const NavIcons = ({ iconName , css }: { iconName: string, css:string}) => {
  return <>{getIcon(iconName, css)}</>;
};
