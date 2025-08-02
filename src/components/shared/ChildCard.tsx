import React from 'react';
import { Card, CardHeader, CardContent, Divider } from '@mui/material';

type Props = {
	title?: string | string[];
	children: JSX.Element | JSX.Element[];
	style?: React.CSSProperties;
};

const ChildCard = ({ title, children, style }: Props) => (
	<Card style={style} sx={{ padding: 0, borderColor: (theme: any) => theme.palette.divider }} variant="outlined">
		{title ? (
			<>
				<CardHeader title={title} />
				<Divider sx={{border:'1px solid #E2E2E2'}} />{' '}
			</>
		) : (
			''
		)}

		<CardContent>{children}</CardContent>
	</Card>
);

export default ChildCard;
