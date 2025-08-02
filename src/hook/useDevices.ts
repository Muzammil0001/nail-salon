import { useQuery } from 'react-query';
import axios from 'axios';

const fetchDevices = async () => {
  const response = await axios.get('/api/devices/getdevices');
  return response.data.data;
};

const useDevicesQuery = () => {
  return useQuery('devices', fetchDevices);
};

export default useDevicesQuery;
