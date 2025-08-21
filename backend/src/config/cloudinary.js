console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "set" : "missing",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "set" : "missing"
});

export default cloudinary;  