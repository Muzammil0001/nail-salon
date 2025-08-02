import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CustomTextField from '../forms/theme-elements/CustomTextField';
import CustomFormLabel from '../forms/theme-elements/CustomFormLabel';
import { t } from "../../../lib/translationHelper";

interface Charge {
  name: string;
  amount: number;
}

interface ExtraChargesDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (charges: Charge[]) => void;
  initialCharges?: Charge[];
  keys: any;
}

const ExtraChargesDialog: React.FC<ExtraChargesDialogProps> = ({
  open,
  onClose,
  onSave,
  initialCharges = [],
  keys,
}) => {
  const [charges, setCharges] = useState<Charge[]>(initialCharges);
  const [errors, setErrors] = useState<{ name: string; amount: string }[]>([]);

  useEffect(() => {
    setCharges(initialCharges);
    setErrors(initialCharges.map(() => ({ name: '', amount: '' })));
  }, [initialCharges, open]);

  const handleAdd = () => {
    setCharges([...charges, { name: '', amount: 0 }]);
    setErrors([...errors, { name: '', amount: '' }]);
  };

  const handleChange = (index: number, field: keyof Charge, value: string | number) => {
    const updated = [...charges];
    (updated as any[])[index][field] = field === 'amount' ? Number(value) : String(value);
    setCharges(updated);

    const updatedErrors = [...errors];
    updatedErrors[index][field] = '';
    setErrors(updatedErrors);
  };

  const handleDelete = (index: number) => {
    setCharges(charges.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const newErrors = charges.map((charge) => ({
      name: charge.name.trim() === '' ? 'Item name is required' : '',
      amount:
        isNaN(charge.amount) || charge.amount <= 0
          ? 'It must be greater than 0'
          : '',
    }));

    setErrors(newErrors);

    const hasErrors = newErrors.some((e) => e.name || e.amount);
    if (hasErrors) return;

    onSave(charges);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      {t("extra_charges", keys)}
      <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        {charges.map((charge, index) => (
          <Stack direction="row" spacing={2} key={index} alignItems="flex-start">
            <Stack flex={1} spacing={0.5}>
              <CustomFormLabel>{t("item_name", keys)}</CustomFormLabel>
              <CustomTextField
                fullWidth
                value={charge.name}
                onChange={(e: any) => handleChange(index, 'name', e.target.value)}
                error={Boolean(errors[index]?.name)}
                helperText={errors[index]?.name}
              />
            </Stack>
            <Stack width="200px" spacing={0.5}>
              <CustomFormLabel>{t("amount_usd", keys)}</CustomFormLabel>
              <CustomTextField
                type="number"
                value={charge.amount}
                onChange={(e: any) => handleChange(index, 'amount', e.target.value)}
                error={Boolean(errors[index]?.amount)}
                helperText={errors[index]?.amount}
              />
            </Stack>
            <IconButton
              onClick={() => handleDelete(index)}
              sx={{ mt: 'auto', alignSelf: 'end' }}
            >
              <DeleteIcon
                className="text-red-600"
                sx={{ mb: Boolean(errors[index]?.amount) ? "20px" : "8px" }}
              />
            </IconButton>
          </Stack>
        ))}
        <Button startIcon={<AddIcon />} onClick={handleAdd} variant="outlined">
          {t("add_charge", keys)}
        </Button>
      </Stack>
    </DialogContent>
    <DialogActions sx={{ mr: '15px' }}>
      <Button onClick={handleSave} variant="contained">
        {t("save", keys)}
      </Button>
    </DialogActions>
  </Dialog>  
  );
};

export default ExtraChargesDialog;
