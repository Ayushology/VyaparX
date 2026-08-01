const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadImage(fileBuffer, fileName, folder = "/products") {
  if (!fileBuffer || !fileName) {
    throw new Error(
      "File buffer and file name are required to upload an image."
    );
  }

  const response = await imagekit.upload({
    file: fileBuffer,
    fileName,                 
    folder,
    useUniqueFileName: true, 

    // ! ImageKit automatically appends a unique hash before the extension
  });

  return {
    url: response.url,
    thumbnail: response.thumbnail || response.url,
    fileId: response.fileId,
  };
}

async function deleteImage(fileId) {
  if (!fileId) {
    throw new Error("A valid fileId is required for ImageKit deletion.");
  }

  try {
    const response = await imagekit.deleteFile(fileId);
    return response;
  } catch (error) {
    console.warn(`[ImageKit Warning] Failed to delete image ${fileId}:`, error.message);
    throw error;
  }
}

async function deleteBulkImages(fileIds = []) {
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return null;
  }

  try {
    const response = await imagekit.bulkDeleteFiles(fileIds);
    return response;
  } catch (error) {
    console.warn("[ImageKit Warning] Bulk deletion failed:", error.message);
    throw error;
  }
}

module.exports = { uploadImage , deleteBulkImages , deleteImage };