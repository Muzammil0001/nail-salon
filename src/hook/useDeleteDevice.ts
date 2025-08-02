import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { ToastSuccessMessage, ToastErrorMessage } from '@/components/common/ToastMessages';

// Define the delete device function using axios
const deleteDevice = async (id: number) => {
  const response = await axios.post('/api/devices/deletedevice', { id });
  return response.data;
};

const useDeleteDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(deleteDevice, {
    onSuccess: () => {
      ToastSuccessMessage("device_deleted_successfully")
      queryClient.invalidateQueries('devices');
    },
    onError: (error: any) => {
      ToastErrorMessage(error)
    },
  });
};

export default useDeleteDeviceMutation;
