import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { ToastErrorMessage, ToastSuccessMessage } from '@/components/common/ToastMessages';

const disableDevice = async (id: number) => {
  const response = await axios.post('/api/devices/disabledevice', { id });
  return response.data;
};

const useDisableDevicesQuery = () => {
  const queryClient = useQueryClient();

  return useMutation(disableDevice, {
    onSuccess: () => {
      ToastSuccessMessage("device_disabled_successfully")
      queryClient.invalidateQueries('devices');
    },
    onError: (error: any) => {
      ToastErrorMessage(error)
    },
  });
};

export default useDisableDevicesQuery;
