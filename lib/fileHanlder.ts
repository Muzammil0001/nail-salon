import { promises as fs } from "fs";
import path from "path";

// Function to save base64 file
export async function saveBase64File(base64Data: string, fileName: string, folder = "uploads") {
  try {
    const uploadDir = path.join(process.cwd(), "public", folder);

    // Ensure the upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Remove the base64 header and prepare the binary content
    const cleanBase64 = base64Data.replace(/^data:.*;base64,/, "");
    
    // Generate a unique file name if not provided
    const uniqueFileName = fileName || `${Date.now()}-${Math.round(Math.random() * 1e9)}-certificate.pdf`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Write the file to disk
    await fs.writeFile(filePath, cleanBase64, "base64");

    // Return the relative path to the saved file
    return `/uploads/${uniqueFileName}`;
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error("Could not save the file");
  }
}
