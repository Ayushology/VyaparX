const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadImage(fileBuffer, fileName, folder = "/products") {
  if (!fileBuffer || !fileName) {
    throw new Error(
      "File buffer and file name are required to upload an image.",
    );
  }

  const response = await imagekit.upload({
    file: fileBuffer.toString("base64"),
    fileName,
    folder,
  });

  return {
    url: response.url,
    thumbnail: response.thumbnail || response.url,
    fileId: response.fileId,
  };
}

module.exports = { uploadImage };
