import * as React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { AlertInterface } from '../../types/admin/types';

interface Props {
	toast: AlertInterface ;
}

const Toast: React.FC<Props> = ({toast}) => {


	return (
		<React.Fragment>
			<Snackbar
				open={toast.open}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
				autoHideDuration={6000}
				onClose={toast.callback}
			>
				<Alert
					onClose={toast.callback}
					severity='info'
					variant='filled'
					sx={{ width: '100%', color: 'white' }}
				>
					<AlertTitle>{toast.description}</AlertTitle>
				</Alert>
			</Snackbar>
		</React.Fragment>
	);
};

export default Toast;
