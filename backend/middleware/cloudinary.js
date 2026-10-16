import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImage(imageName) {
  const imagePath = path.resolve(`./public/uploads/${imageName}`);

  // If Cloudinary credentials are configured, try uploading
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const result = await cloudinary.uploader.upload(imagePath, {
        folder: "attendease/attendance",
      });

      // Safely cleanup temporary local file
      fs.unlink(imagePath, (err) => {
        if (err && err.code !== "ENOENT") console.error("Error removing local temp file:", err);
      });

      return result.secure_url || result.url;
    } catch (error) {
      console.warn("Cloudinary upload failed, falling back to local storage URL:", error.message);
    }
  }

  // Fallback to serving from local static server
  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5050}`;
  return `${serverUrl}/uploads/${imageName}`;
}

export default uploadImage;
