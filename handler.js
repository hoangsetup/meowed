'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'ap-northeast-1'});
const path = require('path');
const Jimp = require('jimp');

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const BUCKET_NAME = 'meowed-upload';

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();

/**
 * meow miaow mrruh prrrup mrow yowl
 * @param event
 * @returns {Promise<{statusCode: number, headers: {"Access-Control-Allow-Origin": string}, body: string}>}
 */
module.exports.requestUploadURL = (event) => {
  // Mrrowow

  const params = JSON.parse(event.body);
  const s3Params = {
    Bucket: 'meowed-upload',
    Key: params.name,
    ContentType: params.type,
    ACL: 'public-read',
  };

  const uploadURL = s3.getSignedUrl('putObject', s3Params);

  return Promise.resolve({
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      uploadURL,
    }),
  });
};

/**
 * meow prrraawww
 * @param event
 * @returns {*}
 */
const getImagesFromEvent = (event) => {
  return event.Records.reduce((accum, r) => {
    if (r.s3.bucket.name === BUCKET_NAME) {
      const key = r.s3.object.key;
      const extension = path.extname(key).toLowerCase();
      if (ALLOWED_EXTENSIONS.indexOf(extension) !== -1 && key.indexOf('catface') === -1) {
        accum.push(key);
      }
    }
    return accum;
  }, []);
};

/**
 * Wrrrao!
 * @param images
 * @returns {Promise<void>}
 */
const detectFacesOnImages = async (images) => {
  let faces = {};
  for (let image of images) {
    const params = {
      Image: {
        S3Object: {
          Bucket: BUCKET_NAME,
          Name: image,
        }
      },
      Attributes: [
        'ALL',
      ]
    };
    let data = await rekognition.detectFaces(params).promise();
    if (data.FaceDetails.length) {
      faces[image] = data;
    }
  }
  return faces;
};

/**
 * mrrrrrr
 * @param key
 * @returns {Promise<PromiseResult<S3.GetObjectOutput, AWSError>>}
 */
const downloadImage = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };
  return await s3.getObject(params).promise();
};

/**
 * ggrrrrrr
 * @param faces
 * @returns {Promise<void>}
 */
const processImages = async (faces) => {
  for (let key of Object.keys(faces)) {
    const faceDetails = faces[key].FaceDetails;
    let response = await downloadImage(key);

    let source = await Jimp.read(response.Body);
    for (let faceDetail of faceDetails) {
      const nose = getNosePoint(faceDetail);
      if (nose) {
        let catface = await Jimp.read('./catface.png');
        // x-coordinate from the top left of the landmark expressed as the ratio of the width of the image.
        // e.x, if the images is 700x200 and the x-coordinate of the landmark is at 350 pixels, this value is 0.5.

        // y-coordinate from the top left of the landmark expressed as the ratio of the height of the image.
        // e.x, if the images is 700x200 and the y-coordinate of the landmark is at 100 pixels, this value is 0.5.
        const {height, width} = source.bitmap;
        resizeCatface(catface, height, width, faceDetail);
        addImageCenter(source, catface, nose.X * width, nose.Y * height);
      }
    }
    let imageBuffer = await new Promise((resolve, reject) => {
      source.getBuffer(source.getMIME(), (err, buffer) => {
        if (err) {
          return reject(err);
        }
        resolve(buffer);
      })
    });
    await uploadImage(key, imageBuffer, source.getMIME());
  }
};

const getNosePoint = (faceDetail) => {
  let nose = null;
  for (let landmark of faceDetail.Landmarks) {
    if (landmark.Type === 'nose') {
      nose = landmark;
    }
  }
  return nose;
};

const addImageCenter = (source, catface, x, y) => {
  const {height, width} = catface.bitmap;
  const newX = x - width / 2;
  const newY = y - height / 2 + 10;
  return source.composite(catface, newX, newY);
};

const resizeCatface = (catface, sHeight, sWidth, faceDetail) => {
  let e_ll = null;
  let e_rr = null;
  for (let landmark of faceDetail.Landmarks) {
    if (landmark.Type === 'leftEyeLeft') {
      e_ll = landmark;
    }
    if (landmark.Type === 'rightEyeRight') {
      e_rr = landmark;
    }
  }
  if (e_ll && e_rr) {
    let catfaceWidth =
      Math.sqrt(Math.pow(e_ll.X * sWidth - e_rr.X * sWidth, 2) + Math.pow(e_ll.Y * sHeight - e_ll.Y * sHeight, 2))
      + 20;

    // Cạnh đối và cạnh kề
    const ab = e_rr.Y * sHeight - e_ll.Y * sHeight;
    const ac = e_rr.X * sWidth - e_ll.X * sWidth;

    const tanACB = ab / ac;

    // Quy đổi radian sang độ
    const deg = Math.atan(tanACB) * 180 / Math.PI;

    catface.resize(catfaceWidth, Jimp.AUTO).rotate(deg);
  }
};

const uploadImage = async (key, imageBufferData, contentType) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `catface-${key}`,
    Body: imageBufferData,
    ACL: 'public-read',
    ContentType: contentType,
  };
  await s3.putObject(params).promise();
};

module.exports.catFace = async (event) => {
  let images = getImagesFromEvent(event);
  let faces = await detectFacesOnImages(images);
  await processImages(faces);

  return faces;
};

