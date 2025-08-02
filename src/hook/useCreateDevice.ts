import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const createDevice = async (newDevice: any) => {
  const response = await axios.post('/api/devices/createdevices', newDevice);
  return response.data;
};

const useCreateDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(createDevice, {
    onSuccess: () => {
      queryClient.invalidateQueries('devices');
    },
    onError: (error: any) => {
      console.error('Error creating device:', error);
    },
  });
};

export default useCreateDeviceMutation;
