import React, { useEffect, useState } from "react";
import { Avatar, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import axios from "axios";
import { useSession } from "next-auth/react";
import Flag from "react-world-flags";
import { ToastErrorMessage } from "@/components/common/ToastMessages";
import { useDispatch } from "@/store/Store";
import { setLanguageUpdate } from "@/store/LanguageSlice";

type AdminLanguageProps = {
height?: number;
  width?: number;
};

const AdminLanguage = ({ height , width}: AdminLanguageProps) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentLang, setCurrentLang] = useState<any>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const open = Boolean(anchorEl);
  const { data: session, status, update }: any = useSession();
  const dispatch = useDispatch();

  const handleClose = () => {
    setAnchorEl(null);
  };
  const setLanguage = async (lan: number) => {
    try {
      if (session) {
        await axios.post("/api/app-translation/setlanguage", {
          translation_language_id: lan,
        });
        update();
      }
      localStorage.setItem("language_id", lan.toString());
      dispatch(setLanguageUpdate(false));
      setTimeout(() => dispatch(setLanguageUpdate(true)), 0);
      setCurrentLang(languages.find((lang) => lang.id === lan));
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      handleClose();
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchactivetranslations"
        );
        setLanguages(response.data);
        if (response.data.length === 0) {
          return;
        }
        if (session?.user?.language_id) {
          setCurrentLang(
            response.data.find(
              (_lang: any) => _lang.id === session.user.language_id
            )
          );
        } else if (
          localStorage.getItem("language_id") &&
          response.data.find(
            (_lang: any) =>
              _lang.id === (localStorage.getItem("language_id") || "0")
          )
        ) {
          setCurrentLang(
            response.data.find(
              (_lang: any) =>
                _lang.id === (localStorage.getItem("language_id") || "0")
            )
          );
        } else {
          setCurrentLang(response.data[0]);
          localStorage.setItem("language_id", response.data[0].id.toString());
        }
      } catch (error) {
        ToastErrorMessage(error);
      }
    })();
  }, [session?.user?.language_id]);

  const handleClick = (event: any) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };
   const hClass = `h-${height ?? 0}`
  const wClass = `w-${width ?? 0}`

  return (
    <>
      {currentLang && languages.length > 0 && (
        <>
          <IconButton
            aria-label="more"
            id="long-button"
            aria-controls={open ? "long-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            onClick={handleClick}
          >
            <Box className={`${hClass} ${wClass} h-8 w-8 z-50 flex justify-center items-center rounded-full overflow-hidden bg-white`}>
            <Flag
                className="w-full h-full object-cover"
                code={currentLang.language.language_code ==="en-US" ? "us" : currentLang.language.language_code}
              />
            </Box>
          </IconButton>
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            sx={{
              "& .MuiMenu-paper": {
                width: "200px",
                zIndex: 2001, 
              },
            }}
          >
            {languages.map((option, index) => (
              <MenuItem
                key={index}
                sx={{ py: 2, px: 3 }}
                onClick={() => setLanguage(option.id)}
              >
                <Box className="flex gap-2 items-center">
                  <Flag
                   code={option.language.language_code ==="en-US" ? "us" : option.language.language_code}
                    style={{ width: 24, height: 16, marginRight: 10 }}
                  />

                  <Typography>{option.language.language_name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </>
  );
};

export default AdminLanguage;
