import React, {useState, useEffect} from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Typography,
} from '@mui/material';
import CustomTextField from '../forms/theme-elements/CustomTextField';
import {t} from "../../../lib/translationHelper"
  import { FormikProps } from 'formik';
  import axios from 'axios';
  import { useSelector } from "@/store/Store";
// Define the type for the props
interface EnvDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isEdit: boolean;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  formik: FormikProps<{
    key: string;
    value: string;
    description: string;
    is_editable: boolean;
    is_visible: boolean;
  }>;
  loading: boolean;
}

const EnvDialog: React.FC<EnvDialogProps> = ({ open, setOpen, isEdit, setIsEdit, formik, loading }) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "configurations" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      }
    })();
  }, [languageUpdate]);
  return (
    <Dialog open={open}
    
    BackdropProps={{
      style: {
        backdropFilter: "blur(5px)",
      },
    }}
    >
      <DialogContent
        sx={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: { sm: '250px', md: '500px' },
        }}
        
      >
        <Typography variant="h5">{t('add_variable', keys)}</Typography>
        <form onSubmit={formik.handleSubmit}>
          <Box>
            <CustomTextField
              label={t('key', keys)}
              onBlur={() => (formik.touched.key = true)}
              fullWidth
              id="key"
              name="key"
              value={formik.values.key}
              onChange={formik.handleChange}
              error={!!formik.touched.key && !!formik.errors.key}
              helperText={formik.touched.key && t(formik.errors.key as string, keys)}
            />
          </Box>

          <Box sx={{ paddingY: '10px' }}>
            <CustomTextField
              multiline
              label={t('value', keys)}
              maxRows={16}
              onBlur={() => (formik.touched.value = true)}
              fullWidth
              id="value"
              name="value"
              value={formik.values.value}
              onChange={formik.handleChange}
              error={!!formik.touched.value && !!formik.errors.value}
              helperText={formik.touched.value && t(formik.errors.value as string, keys)}
              inputProps={{
                maxLength: 15000,
              }}
            />
          </Box>
          <Box>
            <CustomTextField
              label={t('description', keys)}
              id="description"
              name="description"
              fullWidth
              value={formik.values.description}
              onChange={formik.handleChange}
            />
          </Box>
          <FormControlLabel
            label={t('editable', keys)}
            control={
              <Checkbox
                id="is_editable"
                name="is_editable"
                checked={formik.values.is_editable}
                onChange={formik.handleChange}
              />
            }
          />
          <FormControlLabel
            label={t('visible', keys)}
            control={
              <Checkbox
                id="is_visible"
                name="is_visible"
                checked={formik.values.is_visible}
                onChange={formik.handleChange}
              />
            }
          />
          <DialogActions>
          <Button
              variant="outlined"
              onClick={() => {
                setIsEdit(false);
                formik.setValues({
                  key: '',
                  value: '',
                  description: '',
                  is_visible: true,
                  is_editable: true,
                });
                formik.setErrors({});
                formik.setTouched({});
                setOpen(false);
              }}
              disabled={loading}
            >
              {t('close', keys)}
            </Button>
            <Button color="primary" variant="contained" type="submit" disabled={loading}>
              {isEdit ? t('update', keys) : t('add_configuration', keys)}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnvDialog;
