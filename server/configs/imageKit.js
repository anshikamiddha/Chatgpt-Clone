import dotenv from "dotenv";
dotenv.config();

import ImageKit from "imagekit";

// Validate ImageKit environment variables
const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();

if (!publicKey || !privateKey || !urlEndpoint) {
  console.error("ERROR: ImageKit environment variables are missing!");
  console.error("Required variables:", {
    IMAGEKIT_PUBLIC_KEY: publicKey ? "✓ Set" : "✗ Missing",
    IMAGEKIT_PRIVATE_KEY: privateKey ? "✓ Set" : "✗ Missing",
    IMAGEKIT_URL_ENDPOINT: urlEndpoint ? "✓ Set" : "✗ Missing",
  });
}

// Create ImageKit instance with validated credentials
let imagekit;
try {
  if (publicKey && privateKey && urlEndpoint) {
    imagekit = new ImageKit({
      publicKey: publicKey,
      privateKey: privateKey,
      urlEndpoint: urlEndpoint,
    });
    console.log("✓ ImageKit initialized successfully");
  } else {
    console.warn("⚠ ImageKit not initialized - credentials missing");
    // Create a dummy instance to prevent errors
    imagekit = new ImageKit({
      publicKey: "",
      privateKey: "",
      urlEndpoint: "",
    });
  }
} catch (error) {
  console.error("ERROR: Failed to initialize ImageKit:", error.message);
  // Create a dummy instance to prevent errors
  imagekit = new ImageKit({
    publicKey: "",
    privateKey: "",
    urlEndpoint: "",
  });
}

export default imagekit;
