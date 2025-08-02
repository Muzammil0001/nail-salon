import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "../../../../../store/Store";
import { useRouter } from "next/router";

// mui imports
import {
  ListItemIcon,
  ListItemButton,
  Collapse,
  styled,
  ListItemText,
  useTheme,
  alpha,
  Radio,
  Box,
  Typography,
} from "@mui/material";

// custom imports
import NavItem from "../NavItem";
import { t } from "../../../../../../lib/translationHelper";

// plugins
import {
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
} from "@tabler/icons-react";
import { AppState } from "../../../../../store/Store";
import { toggleMobileSidebar } from "../../../../../store/customizer/CustomizerSlice";

type NavGroupProps = {
  [x: string]: any;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: any;
};

interface NavCollapseProps {
  menu: NavGroupProps;
  level: number;
  pathWithoutLastPart: any;
  pathDirect: any;
  hideMenu: any;
  isOpen: any;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  openCollapseId: any;
  updateSession: (entity: string, is_company: boolean) => void;
  keys: { text: string; translation: string }[];
}

// FC Component For Dropdown Menu
const NavCollapse = ({
  keys,
  menu,
  level,
  pathWithoutLastPart,
  pathDirect,
  hideMenu,
  onClick,
  isOpen,
  openCollapseId,
  updateSession,
}: NavCollapseProps) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const customizer = useSelector((state: AppState) => state.customizer);
  const Icon = menu?.icon;
  const theme = useTheme();
  const { pathname } = useRouter();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const menuIcon =
    level > 1 ? (
      <Icon stroke={1.5} size="1rem" />
    ) : (
      <Icon stroke={1.5} size="1.3rem" />
    );
  const dispatch = useDispatch();

  const handleClick = () => {
    setOpen((prevOpen) => !prevOpen);
    onClick(menu.id);
  };

  const onClickExtended = () => {
    onClick;
    dispatch(toggleMobileSidebar());
  };

  useEffect(() => {
    setOpen(
      pathWithoutLastPart === menu?.href ||
        menu?.children?.some(
          (item: any) => item.href.split("?")[0] === pathname
        ) ||
        isOpen
    );
  }, [pathname, menu.children, menu.href, pathWithoutLastPart, isOpen]);

  const ListItemStyled = styled(ListItemButton)(() => ({
    marginBottom: "2px",
    padding: "8px 10px",
    paddingLeft: hideMenu ? "10px" : level > 2 ? `${level * 15}px` : "10px",
    width: hideMenu ? "44px" : "auto",
    backgroundColor:
      openCollapseId === menu.id && open && level < 2
        ? theme.palette.primary.light
        : "",
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor:
        pathname.includes(menu?.href) || open
          ? alpha(theme.palette.primary.main, 0.85)
          : theme.palette.primary.light,
      color:
        pathname.includes(menu?.href) || open
          ? "white"
          : theme.palette.primary.main,
    },
    color:
      openCollapseId === menu.id && open && level < 2
        ? theme.palette.primary.main
        : level > 1 && open
        ? theme.palette.primary.main
        : theme.palette.text.secondary,
    borderRadius: `${customizer.borderRadius}px`,
  }));

  const submenus = menu?.children?.map((item: any) => {
    if (item.children) {
      return (
        <NavCollapse
          keys={keys}
          key={item?.id}
          menu={item}
          level={level + 1}
          pathWithoutLastPart={pathWithoutLastPart}
          pathDirect={pathDirect}
          hideMenu={hideMenu}
          onClick={onClick}
          isOpen={isOpen}
          openCollapseId={openCollapseId}
          updateSession={updateSession}
        />
      );
    } else {
      return (
        <NavItem
          keys={keys}
          key={item.id}
          item={item}
          level={level + 1}
          pathDirect={pathDirect}
          hideMenu={hideMenu}
          onClick={onClickExtended}
          onEntityClick={(input: string, is_company: boolean) => {
            updateSession(input, is_company);
          }}
        />
      );
    }
  });
  return (
    <>
      {menu?.title?.toLowerCase().trim() === "locations" && !customizer.isCollapse && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "#A7ACB2",
            marginY: "10px",
            marginLeft: "-20px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "2px",
              backgroundColor: "#A7ACB2",
              marginRight: "8px",
            }}
          />
          <Typography sx={{ fontSize: "16px", fontWeight: "700" }}>
            {t("locations_management", keys)}
          </Typography>
        </Box>
      )}
      <ListItemStyled
        onClick={handleClick}
        selected={pathWithoutLastPart === menu?.href}
        key={menu?.id}
      >
        <ListItemIcon
          sx={{
            minWidth: "36px",
            p: "3px 0",
            color: "inherit",
          }}
        >
          {menuIcon}
        </ListItemIcon>
        <ListItemText color="inherit" sx={{ textTransform: "capitalize" }}>
          {hideMenu ? (
            ""
          ) : (
            <>
              {menu.title
                ? t(
                    menu.title
                      .toLowerCase()
                      .replace(/ /g, "_")
                      .replace(/[^\w\s]/g, ""),
                    keys
                  )
                : ""}
            </>
          )}
        </ListItemText>
        {!isOpen ? (
          <IconChevronRight size="1rem" />
        ) : (
          <IconChevronDown size="1rem" />
        )}
      </ListItemStyled>
      {isOpen && (
        <Collapse
          in={open}
          timeout="auto"
          unmountOnExit
          sx={{
            // background: alpha(theme.palette.primary.main, 0.1),
            marginLeft: "1rem",
            borderRadius: "0.5rem",
          }}
        >
          {submenus}
        </Collapse>
      )}
      {menu?.title?.toLowerCase().trim() === "locations" && !customizer.isCollapse && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "#A7ACB2",
            marginY: "10px",
            marginLeft: "-20px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "2px",
              backgroundColor: "#A7ACB2",
              marginRight: "8px",
            }}
          />
          <Typography sx={{ fontSize: "16px", fontWeight: "700" }}>
            {t("management", keys)}
          </Typography>
        </Box>
      )}
    </>
  );
};

export default NavCollapse;
