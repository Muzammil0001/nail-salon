// lib/fileSaver.ts
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const fileSaver = async (
  base64: string,
  savePath: string,
  filename?: string
): Promise<string | null> => {
  const base64Data = base64.split(",")[1];
  const buffer = Buffer.from(base64Data, "base64");

  if (!fs.existsSync(savePath)) {
    fs.mkdirSync(savePath, { recursive: true });
  }

  const name =
    filename || `${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
  const fullPath = path.join(savePath, name);

  try {
    await sharp(buffer)
    .resize({
      width: 1024,         
      height: 1024,
      fit: "inside",        
    })
    .webp({ quality: 75 })  
    .toFile(fullPath);
    return name;
  } catch (err) {
    console.error("Image processing error:", err);
    return null;
  }
};
