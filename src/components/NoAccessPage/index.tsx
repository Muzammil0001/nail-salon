import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { t } from '../../../lib/translationHelper';
import axios from 'axios';
import Loader from '../loader/Loader';
import { useSelector } from '@/store/Store';
const AccessDenied: React.FC = () => {

    const languageUpdate = useSelector((state) => state.language.languageUpdate);
    const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const response = await axios.post(
                    "/api/app-translation/fetchbypagename",
                    { page_name: "dashboard" }
                );
                setKeys(response.data);
            } catch (error) {
                console.error("Error while fetching translations:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [languageUpdate]);

    return (
        <>
        <Loader loading={loading} />
        <Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '80vh',
    textAlign: 'center',
    px: 2,
  }}
>
  <Typography
    variant="h1"
    fontWeight={900}
    gutterBottom
    sx={{
      fontSize: { xs: '2.5rem', sm: '4rem', md: '5rem' },
      lineHeight: 1.2,
    }}
  >
    {t("not_authorized", keys)}
  </Typography>

  <Typography
    variant="subtitle1"
    maxWidth="600px"
    sx={{
      fontSize: { xs: '1rem', sm: '1.2rem' },
    }}
  >
    {t("access_denied_message", keys)}
  </Typography>
</Box>
      </>
    );
};

export default AccessDenied;
