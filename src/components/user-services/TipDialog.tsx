import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CustomTextField from '../forms/theme-elements/CustomTextField';
import CustomFormLabel from '../forms/theme-elements/CustomFormLabel';
import { t } from "../../../lib/translationHelper";

interface TipDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (tipAmount: number) => void;
  initialTip?: number;
  keys: any;
}

const TipDialog: React.FC<TipDialogProps> = ({ open, onClose, onSave, initialTip = 0, keys }) => {
  const [tip, setTip] = useState<number>(initialTip);

  const handleSave = () => {
    onSave(tip);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t("add_tip", keys)}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <CustomFormLabel>{t("tip_amount", keys)} ($)</CustomFormLabel>
        <CustomTextField
          fullWidth
          type="number"
          value={tip}
          onChange={(e: any) => setTip(Number(e.target.value))}
        />
      </DialogContent>

      <DialogActions sx={{ mr: "15px" }}>
        <Button onClick={handleSave} variant="contained">
          {t("save", keys)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TipDialog;