import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography, useTheme } from '@mui/material';
import axios from 'axios';
import { ToastErrorMessage } from '../common/ToastMessages';
import Loader from '../loader/Loader';
import { getContrastTextColor } from '../../../lib/colorTextContrastHelper';
import { t } from "../../../lib/translationHelper";

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  display_color?: string;
}

interface StaffGridProps {
  onSelect: (staff: Staff) => void;
  keys: any;
}

const StaffGrid: React.FC<StaffGridProps> = ({ onSelect, keys }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/users/fetchusers", { fetchAll: true });
        if (response.status === 200) {
          const fetchedStaff = response.data?.users || [];
          setStaffList(fetchedStaff);

          const stored = localStorage.getItem('pos_selected_staff');
          if (stored) {
            try {
              const parsedStaff: Staff = JSON.parse(stored);
              const exists = fetchedStaff.some((s: Staff) => s.id === parsedStaff.id);
              if (!exists) {
                localStorage.removeItem('pos_selected_staff');
              }
            } catch (err) {
              console.error("Invalid stored staff:", err);
              localStorage.removeItem('pos_selected_staff');
            }
          }
        }
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);


  const handleSelect = (staff: Staff) => {
    setSelectedId(staff.id);
    onSelect(staff);
  };

  return (
    <>
      <Loader loading={loading} />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          p: 2,
          alignItems: 'flex-start',
          height:200,
       
        }}
      >
      {staffList?.map((staff) => {
        const bgColor = staff.display_color || '#1976d2';
        const textColor = getContrastTextColor(bgColor);
        const isSelected = selectedId === staff.id;

        return (
          <Box
            key={staff.id}
            onClick={() => handleSelect(staff)}
            sx={{
              backgroundColor: bgColor,
              color: textColor,
              height: 200,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              flexGrow: 1,
              cursor: 'pointer',
              textAlign: 'center',
              px: 2,
              py: 1,
              border: isSelected
                ? '2px solid #1976d2'
                : '2px solid transparent',
              boxShadow: isSelected
                ? '0 6px 20px rgba(25, 118, 210, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.25s ease-in-out',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ textTransform: 'capitalize' }}
            >
              {staff.first_name} {staff.last_name}
            </Typography>
          </Box>
        );
      })}
    </Box >

    </>
  );
};

export default StaffGrid;
