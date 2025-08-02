import { useQuery } from 'react-query';
import axios from 'axios';

const fetchSingleDevice = async (deviceId: number) => {
  const response = await axios.post('/api/devices/getsingledevice', { id: deviceId });
  return response.data;
};

const useSingleDeviceQuery = (id: number) => {
  return useQuery(['singleDevice', id], () => fetchSingleDevice(id), {
    enabled: !!id,
    onError: (error: any) => {
      console.error('Error fetching single device:', error);
    },
  });
};

export default useSingleDeviceQuery;
