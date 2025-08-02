import { NextApiRequest, NextApiResponse } from 'next';
import { logToFile } from '../../../../utils/logHelper';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    logToFile(req.body);
    res.status(200).json({ message: 'log_saved' });
  } else {
    res.status(405).end(); 
  }
}
