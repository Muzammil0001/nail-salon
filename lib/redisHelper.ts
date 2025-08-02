// import { logToFile } from '../utils/logHelper';
import redis, { isConnected } from './redis';

export const deleteRedisKey = async (key: string, subdomain: string = '') => {
	try {
		if (isConnected()) {
			redis.del(key);
		}
	} catch (error) {
		// logToFile(error);
		//console.log('Failed to delete key:', error);
	}
};
