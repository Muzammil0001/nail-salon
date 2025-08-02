import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  ListItemIcon,
  List,
  styled,
  ListItemText,
  Chip,
  useTheme,
  Typography,
  ListItemButton,
} from "@mui/material";
import { t } from "../../../../../../lib/translationHelper";

type NavGroup = {
  [x: string]: any;
  id?: string | number;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: any;
  children?: NavGroup[];
  chip?: string;
  chipColor?: any;
  variant?: string | any;
  external?: boolean;
  level?: number;
  onClick?: React.MouseEvent<HTMLButtonElement, MouseEvent>;
};

interface ItemType {
  item: NavGroup;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  onEntityClick: (entity: string, is_location: boolean) => void;
  hideMenu?: any;
  level?: number | any;
  pathDirect: string;
  keys: { text: string; translation: string }[];
}

const NavItem = ({
  item,
  level,
  pathDirect,
  hideMenu,
  onClick,
  onEntityClick,
  keys,
}: ItemType) => {
  const Icon = item?.icon;
  const theme = useTheme();

  const itemIcon =
    level > 1 ? (
      <Icon
        stroke={1.5}
        size="1rem"
        style={{
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: pathDirect === item?.href ? "20px" : "14px",
          width: pathDirect === item?.href ? "20px" : "14px",
          border:
            pathDirect === item?.href
              ? "2px solid rgba(34, 118, 255, 0)"
              : "none",
          backgroundColor:
          pathDirect === item?.href ? "rgba(34, 118, 255, 0.15)" : "transparent",
          borderRadius: "50%",
          margin: 0,
          padding: 0,
          fontWeight: pathDirect === item?.href ? "bold" : "normal",
          marginLeft: pathDirect === item?.href ? "1px" : "5px",
        }}
      />
    ) : (
      <Icon stroke={1.5} size="1.3rem" />
    );
  const ListItemStyled = styled(ListItemButton)(() => ({
    whiteSpace: "nowrap",
    marginBottom: "2px",
    padding: "8px 10px",
    width: hideMenu ? "44px" : "auto",
    // borderRadius: `${customizer.borderRadius}px`,
    backgroundColor: level > 1 ? "transparent !important" : "inherit",
    color: level > 1 && pathDirect === item?.href
        ? `${theme.palette.primary.main}!important`
        : theme.palette.text.secondary,
    paddingLeft: hideMenu ? "10px" : level > 2 ? `${level * 15}px` : "10px",
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.main,
    },
    "&.Mui-selected": {
      backgroundColor: "transparent",
      color: `blue !important`,
      borderRight:
        level > 1 &&
        item.is_location_selected !== true &&
        `6px solid blue`,
      "&:hover": {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.main,
      },
    },
  }));

  const listItemProps: {
    component: any;
    href?: string;
    target?: any;
    to?: any;
  } = {
    component: item?.external ? "a" : Link,
    to: item?.href,
    href: item?.external ? item?.href : "",
    target: item?.external ? "_blank" : "",
  };

  const handleClick = (input: any) => {
    if (item.is_location || item.is_location) {
      input.preventDefault();
      onEntityClick(item.db_id as any, item.is_location ?? false);
    } else {
      onClick(input);
    }
  };
  return (
    <List component="li" disablePadding key={item?.id && item.title}>
      <Link href={item.href}>
        <ListItemStyled
          // {...listItemProps}
          disabled={item?.disabled}
          selected={
            pathDirect === item?.href ||
            item.is_location_selected
          }
          onClick={(event) => handleClick(event)}
        >
          <ListItemIcon
            sx={{
              minWidth: "36px",
              p: "3px 0",
              color:
                (level > 1 && pathDirect === item?.href) ||
                item.is_location_selected
                  ? `blue !important`
                  : "inherit",
            }}
          >
            {itemIcon}
          </ListItemIcon>
          <ListItemText sx={{ textTransform: "capitalize" }}>
            {hideMenu ? (
              ""
            ) : (
              <>
                {item?.title
                  ? item?.translate || item?.translate === undefined
                    ? t(
                        item?.title,
                        keys
                      )
                    : item?.title
                  : ""}
              </>
            )}
            <br />
            {item?.subtitle ? (
              <Typography variant="caption">
                {hideMenu ? "" : item?.subtitle}
              </Typography>
            ) : (
              ""
            )}
          </ListItemText>

          {!item?.chip || hideMenu ? null : (
            <Chip
              color={item?.chipColor}
              variant={item?.variant ? item?.variant : "filled"}
              size="small"
              label={item?.chip}
            />
          )}
        </ListItemStyled>
      </Link>
    </List>
  );
};

export default NavItem;
