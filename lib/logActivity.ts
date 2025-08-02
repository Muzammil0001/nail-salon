import prisma from "../lib/prisma";
import { getServerSession } from 'next-auth/next';
import { options } from '@/pages/api/auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';


export const logActivity = async ({
  message,
  location_id,
  company_id,
  req,
  res,
}: {
  message: string;
  location_id?: string; 
  company_id?: string; 
  req: NextApiRequest;
  res: NextApiResponse;
}) => {
  try {
    
    const session: any = await getServerSession(req, res, options);
    const userId = session?.user?.id;

    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    const user_agent = req.headers['user-agent'] || 'Unknown';

    
    await prisma.activity_logs.create({
      data: {
        user_id: userId,
        message,
        location_id: location_id || null, 
        user_agent,
      },
    });

    console.log('Activity logged successfully');
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
