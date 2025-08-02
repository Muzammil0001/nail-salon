import prisma from './prisma';

export const getInternalEmails = async () => {
	const data = await prisma.configuration.findUnique({
		where: {
			key: 'INTERNAL_EMAILS',
		},
	});
	const emails: string[] = [];
	if (data !== null) {
		const internal_emails = data.value.split(';');
		internal_emails.map((email:string) => {
			if (email !== null && email !== '') {
				emails.push(email);
			}
		});
	}
	return emails;
};
