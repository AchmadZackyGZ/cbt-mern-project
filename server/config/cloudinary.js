import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import "dotenv/config";

// konfigurasi .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// konfigurasi cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cbt_questions", // Nama folder di Cloudinary
    allowed_formats: ["jpeg", "jpg", "png"],
    // public_id: (req, file) => 'cbt-' + Date.now(), // (Opsional) custom nama file
  },
});

export { storage, cloudinary };
