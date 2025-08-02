import CircularProgress from "@mui/material/CircularProgress";
import {
  Avatar,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  Box,
  ListItemAvatar,
  ListItemText,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { IconPlus, IconUser } from "@tabler/icons-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface AlertInterface {
  open: boolean;
  title?: any;
  description?: any;
  callback?: () => void;
}

interface Props {
  alert: AlertInterface | null;
}

const Alert: React.FC<Props> = ({ alert }) => {
  const { t } = useTranslation();

  if (alert && alert.open)
    return (
      <Dialog open={alert.open ?? false}>
        <DialogTitle sx={{ textAlign: "center" }}>{t(alert.title)}</DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ textAlign: "center" }}
            id="alert-dialog-description"
          >
            {t(alert.description)}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={alert.callback} autoFocus>
            {/* {t('ok')} */}
            OK
          </Button>
        </DialogActions>
      </Dialog>
    );
  else return null;
};

export default Alert;
