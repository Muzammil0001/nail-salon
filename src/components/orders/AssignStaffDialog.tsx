import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  MenuItem,
  FormControl,
  FormHelperText,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CustomFormLabel from '../forms/theme-elements/CustomFormLabel';
import CustomSelect from '../forms/theme-elements/CustomSelect';
import { ToastErrorMessage, ToastSuccessMessage } from '../common/ToastMessages';
import axios from 'axios';

interface AssignStaffDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  staffId?: string;
  onAssignSuccess?: () => void;
}

const AssignStaffDialog: React.FC<AssignStaffDialogProps> = ({
  open,
  onClose,
  orderId,
  staffId = '',
  onAssignSuccess,
}) => {
  console.log("====== ~ staffId:", staffId)
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>(staffId);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setSelectedStaff(staffId);
      setError('');
      fetchStaff();
    }
  }, [open, staffId]);

  const fetchStaff = async () => {
    try {
      const response = await axios.post('/api/users/fetchusers', { fetchAll: true });
      if (response.status === 200) {
        setStaffList(response.data?.users || []);
      }
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  const handleSave = async () => {
    if (!selectedStaff) {
      setError('Please select a staff member');
      return;
    }

    try {
      const response = await axios.post('/api/orders/assignstaff', {
        order_id: orderId,
        staff_id: selectedStaff,
      });
      ToastSuccessMessage(response?.data?.ToastMessages || "Staff assigned successfully.");
      onAssignSuccess?.();
      handleClose(); 
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  const handleClose = () => {
    setSelectedStaff(''); 
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Assign Staff
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <FormControl fullWidth error={!!error}>
          <CustomFormLabel required>Staff</CustomFormLabel>
          <CustomSelect
            name="staff_id"
            value={selectedStaff}
            onChange={(e: any) => {
              setSelectedStaff(e.target.value);
              setError('');
            }}
            displayEmpty
            className="w-full capitalize border-black"
            renderValue={(selected: any) => {
              const selectedStaffObj = staffList.find((staff) => staff.id === selected);
              return selectedStaffObj
                ? `${selectedStaffObj.first_name} ${selectedStaffObj.last_name}`
                : 'Select Staff';
            }}
          >
            {staffList.map((staff) => (
              <MenuItem key={staff.id} value={staff.id}>
                {staff.first_name} {staff.last_name}
              </MenuItem>
            ))}
          </CustomSelect>
          {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ mr: '15px' }}>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignStaffDialog;
