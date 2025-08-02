import React, { useEffect } from "react";
import { Avatar, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";

const Languages = [
  {
    flagname: "English (UK)",
    icon: "/images/flag/icon-flag-en.svg",
    value: "en",
  },
  {
    flagname: "Hrvatski (Crotian)",
    icon: "/images/flag/icon-flag-hr.png",
    value: "hr",
  },
];

const Language = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const [currentLang, setCurrentLang] = React.useState(Languages[1]);
  const [icon, setIcon] = React.useState(Languages[0].icon);

  const { i18n } = useTranslation();
  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const setLanguage = (lan: string) => {
    localStorage.setItem("language", lan);
    setIcon(
      (Languages.find((_lang) => _lang.value === lan) || Languages[1]).icon
    );
    Cookies.set("i18next", lan);

    i18n.changeLanguage(lan);
    handleClose();
  };

  useEffect(() => {
    setIcon(
      (
        Languages.find(
          (_lang) => _lang.value === localStorage.getItem("language")
        ) || Languages[0]
      ).icon
    );
  }, []);

  return (
    <>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? "long-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <Avatar
          src={icon}
          alt={currentLang.value}
          sx={{ width: 33, height: 33 }}
        />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{
          "& .MuiMenu-paper": {
            width: "200px",
          },
        }}
      >
        {Languages.map((option, index) => (
          <MenuItem
            key={index}
            sx={{ py: 2, px: 3 }}
            onClick={() => setLanguage(option.value)}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                src={option.icon}
                alt={option.icon}
                sx={{ width: 20, height: 20 }}
              />
              <Typography> {option.flagname}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default Language;
