// import React, { useState } from 'react';
// import {
// 	TextField,
// 	Button,
// 	Box,
// 	Typography,
// 	FormControl,
// 	FormControlLabel,
// 	Switch,
// 	Dialog,
// 	DialogTitle,
// 	DialogContent,
// 	DialogActions,
// } from '@mui/material';
// import axios from 'axios';
// import { useTranslation } from 'react-i18next';

// const SubscriptionForm = () => {
// 	const [name, setName] = useState('');
// 	const [description, setDescription] = useState('');
// 	const [startDate, setStartDate] = useState('');
// 	const [endDate, setEndDate] = useState('');
// 	const [price, setPrice] = useState('');
// 	const [duration, setDuration] = useState('');
// 	const [activeStatus, setActiveStatus] = useState(true);
// 	const [deleteStatus, setDeleteStatus] = useState(false);
// 	const [deletedStatus, setDeletedStatus] = useState(false);
// 	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
// 	const [openEditDialog, setOpenEditDialog] = useState(false);
// 	const [Plan, setPlan] = useState();
// 	const { t } = useTranslation();
// 	// TODO show success or failure message
// 	// if name is already in use no error show on screen
// 	const handleSubmit = async event => {
// 		event.preventDefault();

// 		try {
// 			const data = {
// 				name,
// 				description,
// 				start_date: startDate,
// 				end_date: endDate,
// 				price,
// 				duration,
// 				active_status: activeStatus,
// 				deleted_status: deleteStatus,
// 			};

// 			const response = await axios.post('/api/subscription/createPlan', data);
// 		} catch (error) {
// 			console.error(error);
// 		}
// 	};

// 	const handleEdit = () => {
// 		setOpenEditDialog(true);
// 	};

// 	const handleDelete = () => {
// 		setOpenDeleteDialog(true);
// 	};

// 	const handleCloseDeleteDialog = async () => {
// 		setOpenDeleteDialog(false);
// 		deletedStatus;
// 		try {
// 			const data = {
// 				name,
// 				deleted_status: deletedStatus,
// 			};

// 			const response = await axios.post('/api/subscription/deletePlan', data);
// 		} catch (error) {
// 			console.error(error);
// 		}
// 	};

// 	const handleCloseEditDialog = async () => {
// 		setOpenEditDialog(false);
// 		setName('');
// 		try {
// 			const response = await axios.post('/api/subscription/planByName', {
// 				name,
// 			});
// 			setPlan(response.data);
// 		} catch (error) {
// 			console.error(error);
// 		}
// 	};

// 	return (
// 		<Box sx={{ maxWidth: 400, margin: 'auto', border: '1px solid #ccc', padding: '16px' }}>
// 			<Typography variant="h5" sx={{ textAlign: 'center', marginBottom: 2 }}>
// 				{t('create_new_plan')}
// 			</Typography>
// 			<Box sx={{ bgcolor: '#212121', color: '#fff', padding: '8px', marginBottom: 2 }}>
// 				<Typography variant="subtitle1">{t('plan_information')}</Typography>
// 			</Box>
// 			<form onSubmit={handleSubmit}>
// 				<TextField label={t('name')} fullWidth value={name} onChange={e => setName(e.target.value)} required margin="dense" />
// 				<TextField
// 					label={t('description')}
// 					fullWidth
// 					value={description}
// 					onChange={e => setDescription(e.target.value)}
// 					required
// 					margin="dense"
// 				/>
// 				<TextField
// 					label={t('start_date')}
// 					fullWidth
// 					type="date"
// 					value={startDate}
// 					onChange={e => setStartDate(e.target.value)}
// 					required={false}
// 					margin="dense"
// 					InputLabelProps={{
// 						shrink: true,
// 					}}
// 				/>
// 				<TextField
// 					label={t('end_date')}
// 					fullWidth
// 					type="date"
// 					value={endDate}
// 					onChange={e => setEndDate(e.target.value)}
// 					required={false}
// 					margin="dense"
// 					InputLabelProps={{
// 						shrink: true,
// 					}}
// 				/>
// 				<TextField label={t('price')} fullWidth value={price} onChange={e => setPrice(e.target.value)} required margin="dense" />
// 				<TextField
// 					label="Duration"
// 					fullWidth
// 					value={duration}
// 					onChange={e => setDuration(e.target.value)}
// 					required
// 					margin="dense"
// 				/>
// 				<Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
// 					<Box sx={{ width: '48%' }}>
// 						<FormControl>
// 							<Typography variant="body1">{t('active_status')}:</Typography>
// 							<FormControlLabel
// 								sx={{ padding: 1 }}
// 								control={<Switch checked={activeStatus} onChange={e => setActiveStatus(e.target.checked)} />}
// 								label={activeStatus ? 'Active' : 'Inactive'}
// 							/>
// 						</FormControl>
// 					</Box>
// 					<Box sx={{ width: '48%' }}>
// 						<FormControl>
// 							<Typography variant="body1">{t('delete_status')}:</Typography>
// 							<FormControlLabel
// 								sx={{ padding: 1 }}
// 								control={<Switch checked={deleteStatus} onChange={e => setDeleteStatus(e.target.checked)} />}
// 								label={deleteStatus ? 'Deleted' : 'Not Deleted'}
// 							/>
// 						</FormControl>
// 					</Box>
// 				</Box>
// 				<Button type="submit" variant="contained" color="primary" sx={{ marginTop: 2 }}>
// 					{t('submit')}
// 				</Button>
// 			</form>
// 			<Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
// 				<Button variant="contained" color="secondary" onClick={handleDelete}>
// 					{t('delete')}
// 				</Button>
// 				<Button variant="contained" color="primary" onClick={handleEdit}>
// 					{t('edit')}
// 				</Button>
// 			</Box>

// 			<Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
// 				<DialogTitle>{t('delete_plan')}</DialogTitle>
// 				<DialogContent>
// 					{/* <Typography variant="body1">Are you sure you want to delete this plan?</Typography> */}
// 					<TextField label={t('name')} fullWidth value={name} onChange={e => setName(e.target.value)} required margin="dense" />
// 					<FormControl>
// 						<Typography variant="body1">{t('Deleted Status')}:</Typography>
// 						<FormControlLabel
// 							sx={{ padding: 1 }}
// 							control={<Switch checked={deletedStatus} onChange={e => setDeletedStatus(e.target.checked)} />}
// 							label={deletedStatus ? 'Deleted' : 'Not Deleted'}
// 						/>
// 					</FormControl>
// 				</DialogContent>
// 				<DialogActions>
// 					<Button onClick={handleCloseDeleteDialog}>{t('cancel')}</Button>
// 					<Button onClick={handleCloseDeleteDialog} color="error">
// 						{t('delete')}
// 					</Button>
// 				</DialogActions>
// 			</Dialog>

// 			<Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
// 				<DialogTitle>{t('edit_plan')}</DialogTitle>
// 				<DialogContent>
// 					{/* Add your edit form elements here */}
// 					<TextField label={t('name')} fullWidth value={name} onChange={e => setName(e.target.value)} required margin="dense" />
// 				</DialogContent>
// 				<DialogActions>
// 					<Button onClick={handleCloseEditDialog}>{t('cancel')}</Button>
// 					<Button onClick={handleCloseEditDialog} color="primary">
// 						{t('save')}
// 					</Button>
// 				</DialogActions>
// 			</Dialog>
// 		</Box>
// 	);
// };

// export default SubscriptionForm;
