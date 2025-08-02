import fs from 'fs';
import winston, { Logger } from 'winston';
import path from 'path';
import cron from 'node-cron';
import { readdir, rmdir } from 'fs/promises';

let logger: Logger; 
const createDirectoryIfNotExists = (directoryPath: string): void => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const createNewFolderStructure = (): void => {
  const now = new Date();
  const currentHour = now.getHours().toString();

  const yyyy = now.getFullYear();
  let mm = (now.getMonth() + 1).toString();
  let dd = now.getDate().toString();

  if (dd.length < 2) dd = '0' + dd;
  if (mm.length < 2) mm = '0' + mm;

  const formattedToday = dd + '-' + mm + '-' + yyyy;
  const adminDir = path.join(logsDir, formattedToday, 'admin');
  const storeDir = path.join(logsDir, formattedToday, 'store');

  createDirectoryIfNotExists(adminDir);
  createDirectoryIfNotExists(storeDir);

 
  const commonDir = adminDir;

  logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.File({ filename: path.join(commonDir, currentHour + '.log') }),
    ],
  });
};

const pathh = process.cwd().split('/');
const logsDir = path.resolve(__dirname, '..', '..', 'logs');
createDirectoryIfNotExists(logsDir);
createNewFolderStructure();


export const deleteFolder = async (): Promise<void> => {
  try {
    const files = await readdir(logsDir, { withFileTypes: true });
    const currentTimestamp = Date.now();

    await Promise.all(
      files
        .filter((dirent) => dirent.isDirectory())
        .map(async (dirent) => {
          const folderName = dirent.name;
          const [day, month, year] = folderName.split('-');
          const folderTimestamp = new Date(`${year}-${month}-${day}`).getTime();

          const daysDifference = Math.floor((currentTimestamp - folderTimestamp) / (1000 * 60 * 60 * 24));

          if (daysDifference > 14) {
            try {
              const folderPath = path.join(logsDir, folderName);
              await rmdir(folderPath, { recursive: true });
              logToFile(`Folder ${folderName} deleted successfully.`, 'info');
            } catch (error) {
              logToFile(`Error deleting folder ${folderName}: ${error}`, 'error');
            }
          }
        })
    );
  } catch (err) {
    console.error('Unable to scan directory:', err);
    logToFile(`Error scanning directory: ${err}`, 'error');
  }
};

// Schedule cron jobs for log management
cron.schedule('0 0 * * *', () => {
  try {
    deleteFolder();
  } catch (error:any) {
    logToFile(`Error during folder cleanup: ${error.message}`, 'error');
  }
});

cron.schedule('0 * * * *', () => {
  try {
    createNewFolderStructure();
  } catch (error:any) {
    logToFile(`Error during folder structure creation: ${error.message}`, 'error');
  }
});


export const logToFile = (log: string | object, logType: 'info' | 'error' = 'info'): void => {
  try {
    if (!logger) {
      console.error('Logger not initialized yet.');
      return;
    }

    if (Array.isArray(log) || typeof log === 'object') {
      log = JSON.stringify(log, null, 2);
    }

    if (logType === 'info') {
      logger.info(log);
    } else if (logType === 'error') {
      logger.error(log);
    } else {
      logger.info(log);
    }

    if (process.env.DEBUG_MODE === "true") {
      console.log(log);
    }
  } catch (error) {
    console.error("Error in logToFile:", error);
  }
};
