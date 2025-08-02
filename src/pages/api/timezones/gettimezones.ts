import { NextApiRequest, NextApiResponse } from 'next';
import moment from 'moment-timezone';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const timezones = moment.tz.names();
    res.status(200).json({ timezones });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`method_not_allowed`);
  }
}
