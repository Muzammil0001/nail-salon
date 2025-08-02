import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { oneSignalId, message } = req.body;

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    console.error("Missing OneSignal credentials.");
    return res.status(500).json({ error: "Missing OneSignal credentials" });
  }

  try {
    const response = await axios.post(
      'https://api.onesignal.com/notifications',
      {
        app_id: appId,
        include_player_ids: [oneSignalId],
        contents: { en: message },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`, 
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (err: any) {
    console.error('Notification failed:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Notification failed',
      details: err.response?.data || err.message,
    });
  }
}
