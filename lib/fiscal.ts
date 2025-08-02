import { exec, execSync } from "child_process";
import { promisify } from "util";
import prisma from "./prisma";
import axios from "axios";
import { decrypt } from "./Encryption";

const execAsync = promisify(exec);
export const createFiscalApp = async (
  cert: any,
  fiscal: any,
  password: string
) => {
  try {
    let folder = cert.certificate_name.split(".")[0];
    let downlaod_url;
    // let all_ips: string[] = [];
    // const config = await prisma.configuration.findUnique({
    //   where: {
    //     key: "FISCAL_IPS",
    //   },
    // });
    // const backup_config = await prisma.configuration.findUnique({
    //   where: {
    //     key: "BACKUP_ADMIN_IPS",
    //   },
    // });
    // if (backup_config?.value) {
    //   const backup_ips = backup_config.value.split(",").map((ip) => ip.trim());
    //   all_ips = [...all_ips, ...backup_ips];
    // }

    // if (!config) {
    //   throw new Error("FISCAL_IPS configuration not found.");
    // }

    // const admin_ips = config.value.split(",").map((ip) => ip.trim());

    // all_ips = [...all_ips, ...admin_ips];

    // for (const ip of all_ips) {
    //   try {
    //     const response = await axios.head(
    //       `http://${ip.split(":")[0]}:4080/certificates/${
    //         cert.certificate_name
    //       }`
    //     );
    //     if (response.status === 200) {
    //       downlaod_url = `http://${ip.split(":")[0]}:4080/certificates/${
    //         cert.certificate_name
    //       }`;
    //     }

    //     break;
    //   } catch (error) {
    //     console.error(`Error fetching data from IP ${ip}:`, error);
    //   }
    // }

    exec(
      `./create_fiscal.sh ${folder} ${downlaod_url} ${cert.certificate_name} ${password} ${fiscal.port}`,
      { encoding: "utf-8" },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Error running script:", error);
          return false;
        } else {
          const outputString = stdout;
          const isAppRunning = outputString
            ? outputString.trim() === "true"
            : false;
          return isAppRunning;
        }
      }
    );
    return true;
  } catch (error) {
    console.error("Error running script:", error);
    return false;
  }
};

export const checkFiscalApp = async (cert: Record<string, any>) => {
  try {
    const folder = cert.certificate_name.split(".")[0];
    const { stdout, stderr } = await execAsync(
      `bash ./check_fiscal.sh ${folder}`
    );
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return false;
    }
    const output = stdout.trim();

    return output === "true";
  } catch (error) {
    console.error("Async error:", error);
    return false;
  }
};
export const stopFiscalApp = (cert: any) => {
  try {
    let folder = cert.certificate_name.split(".")[0];
    const output = execSync(`./stop_fiscal.sh ${folder}`, {
      encoding: "utf-8",
    });
    const outputString = output;
    const isAppStopped = outputString ? outputString.trim() === "true" : false;
    return isAppStopped;
    // });
  } catch (error) {
    console.error("Error running script:", error);
    return false; // Assuming an error indicates the app is not running
  }
};

export const syncFiscal = async (fiscalApp: any) => {
  if (fiscalApp?.deployed && !fiscalApp.deleted_status) {
    const app_check = await checkFiscalApp(fiscalApp);
    if (app_check === false) {
      const decryptedPassword = await decrypt(fiscalApp.password);
      await createFiscalApp(fiscalApp, fiscalApp.fiscal[0], decryptedPassword);
    }
  } else if (fiscalApp?.deleted_status) {
    const app_check = await checkFiscalApp(fiscalApp);
    if (app_check === true) {
      stopFiscalApp(fiscalApp);
    }
  } else if (!fiscalApp?.deployed && !fiscalApp?.deleted_status) {
    const app_check = await checkFiscalApp(fiscalApp);
    if (app_check === true) {
      stopFiscalApp(fiscalApp);
    }
  }
};
