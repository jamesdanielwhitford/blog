/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs');

admin.initializeApp();

exports.optimizeMedia = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType;
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const tempLocalFile = path.join(os.tmpdir(), fileName);

  // Exit if this is triggered on a file that is not an image or video
  if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
    return null;
  }

  await admin.storage().bucket(object.bucket).file(filePath).download({ destination: tempLocalFile });

  if (contentType.startsWith('image/')) {
    // Generate mobile version
    const mobileFile = path.join(fileDir, `${fileName}_mobile`);
    await sharp(tempLocalFile).resize(640, 360).toFile(mobileFile);
    await admin.storage().bucket(object.bucket).upload(mobileFile, { destination: mobileFile });

    // Generate laptop version
    const laptopFile = path.join(fileDir, `${fileName}_laptop`);
    await sharp(tempLocalFile).resize(1280, 720).toFile(laptopFile);
    await admin.storage().bucket(object.bucket).upload(laptopFile, { destination: laptopFile });
  } else if (contentType.startsWith('video/')) {
    // Generate video thumbnail
    const thumbnailFile = path.join(fileDir, `${fileName}_thumbnail.jpg`);
    // Use a video processing library like FFmpeg to generate the thumbnail
    // For example: await generateVideoThumbnail(tempLocalFile, thumbnailFile);
    await admin.storage().bucket(object.bucket).upload(thumbnailFile, { destination: thumbnailFile });
  }

  fs.unlinkSync(tempLocalFile);

  return null;
});
