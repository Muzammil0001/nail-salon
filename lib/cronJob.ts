import cron from 'node-cron';
import sendEmail from './sendEmail';
import prisma from './prisma'; 
import { generateEmailTemplate } from './emailTemplate'; 
import { getInternalEmails } from './getInternalEmails'; 


cron.schedule('* * * * *', async () => {
  console.log('Running cron job to check for due announcements...');

  try {
  //logic here
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});
