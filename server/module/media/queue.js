const path = require('path');
const fs = require('fs');
const config = require('./config');
const _ = require('lodash');
const Queue = require('../../kernel/services/queue');

const mediaQ = Queue.create(`media_${process.env.LOCAL_ID}`);
const uploadQ = Queue.create(`media_upload_${process.env.LOCAL_ID}`);
const Video = require('./components/video');

mediaQ.process(async (job, done) => {
  const data = job.data.data;
  const command = job.data.command;
  try {
    if (command === 'convert-mp4') {
      const canPlay = await Video.canPlayInBrowser(data.filePath);
      if (!canPlay) {
        await DB.Media.update({
          _id: data.mediaId
        }, {
          $set: {
            convertStatus: 'processing'
          }
        });
        const convertFileName = await Video.toMp4({
          filePath: data.filePath
        });

        await DB.Media.update({ _id: data.mediaId }, {
          $set: {
            filePath: path.join(config.videoDir, convertFileName),
            mimeType: 'video/mp4',
            convertStatus: 'done'
          }
        });
        // TODO - remove original file
      } else {
        await DB.Media.update({ _id: data.mediaId }, {
          $set: { convertStatus: 'done' }
        });
      }

      if (!data.uploaded && process.env.USE_S3 === 'true') {
        const media = await DB.Media.findOne({ _id: data.mediaId });
        if (media) {
          await this.uploadS3(media);
        }
      }
    }

    done();
  } catch (e) {
    if (command === 'convert-mp4') {
      await DB.Media.update({ _id: data.mediaId }, {
        $set: { convertStatus: 'failed' }
      });
    }
    await Service.Logger.create({
      level: 'error',
      error: e,
      path: 'media-error'
    });
    done();
  }
});

function createFileName(folder, filePath, prefix = '') {
  // prevent overwrite existing file
  const rand = Helper.String.randomString(7);
  const name = `${prefix}${rand}_${Helper.String.getFileName(filePath)}`;
  return `${folder}/${name}`;
}

function removeLocalFile(media) {
  if (media.originalPath) {
    if (fs.existsSync(media.originalPath)) {
      fs.unlinkSync(media.originalPath);
    } else if (fs.existsSync(path.resolve(media.originalPath))) {
      fs.unlinkSync(path.resolve(media.originalPath));
    } else if (fs.existsSync(path.join(process.env.APP_ROOT_DIR, media.originalPath))) {
      fs.unlinkSync(path.join(process.env.APP_ROOT_DIR, media.originalPath));
    }
  }

  if (media.filePath) {
    if (fs.existsSync(media.filePath)) {
      fs.unlinkSync(media.filePath);
    } else if (fs.existsSync(path.resolve(media.filePath))) {
      fs.unlinkSync(path.resolve(media.filePath));
    } else if (fs.existsSync(path.join(process.env.APP_ROOT_DIR, media.filePath))) {
      fs.unlinkSync(path.join(process.env.APP_ROOT_DIR, media.filePath));
    }
  }

  if (media.thumbPath) {
    if (fs.existsSync(media.thumbPath)) {
      fs.unlinkSync(media.thumbPath);
    } else if (fs.existsSync(path.resolve(media.thumbPath))) {
      fs.unlinkSync(path.resolve(media.thumbPath));
    } else if (fs.existsSync(path.join(process.env.APP_ROOT_DIR, media.thumbPath))) {
      fs.unlinkSync(path.join(process.env.APP_ROOT_DIR, media.thumbPath));
    }
  }

  if (media.mediumPath) {
    if (fs.existsSync(media.mediumPath)) {
      fs.unlinkSync(media.mediumPath);
    } else if (fs.existsSync(path.resolve(media.mediumPath))) {
      fs.unlinkSync(path.resolve(media.mediumPath));
    } else if (fs.existsSync(path.join(process.env.APP_ROOT_DIR, media.mediumPath))) {
      fs.unlinkSync(path.join(process.env.APP_ROOT_DIR, media.mediumPath));
    }
  }
}

uploadQ.process(async (job, done) => {
  // do upload to s3 and delete local file
  try {
    const media = job.data.media;
    const options = job.data.options || {};
    const update = {};
    if (media.type === 'photo') {
      if (media.filePath && !Helper.String.isUrl(media.filePath)) {
        const fileName = createFileName('photos', media.filePath);
        const s3FileUrl = await Service.S3.uploadFile(media.filePath, {
          fileName,
          ACL: options.ACL || 'public-read'
        });
        update.originalPath = s3FileUrl.url;
        update.filePath = s3FileUrl.url;
      }

      if (media.thumbPath && !Helper.String.isUrl(media.thumbPath)) {
        const fileName = createFileName('photos', media.thumbPath);
        const s3FileUrl = await Service.S3.uploadFile(media.thumbPath, {
          fileName,
          ACL: options.ACL || 'public-read'
        });
        update.thumbPath = s3FileUrl.url;
      }

      if (media.mediumPath && !Helper.String.isUrl(media.mediumPath)) {
        const fileName = createFileName('photos', media.mediumPath);
        const s3FileUrl = await Service.S3.uploadFile(media.mediumPath, {
          fileName,
          ACL: options.ACL || 'public-read'
        });
        update.mediumPath = s3FileUrl.url;
      }
    } if (media.type === 'video') {
      if (media.filePath && !Helper.String.isUrl(media.filePath)) {
        const fileName = createFileName('videos', media.filePath);
        const s3FileUrl = await Service.S3.uploadFile(media.filePath, {
          fileName,
          ACL: options.ACL || 'public-read'
        });
        update.filePath = s3FileUrl.url;
      }

      if (media.originalPath && !Helper.String.isUrl(media.originalPath)) {
        const fileName = createFileName('videos', media.originalPath, 'origin_');
        const s3FileUrl = await Service.S3.uploadFile(media.originalPath, {
          fileName,
          ACL: options.ACL || 'public-read'
        });
        update.originalPath = s3FileUrl.url;
      }
    } else if (media.filePath && !Helper.String.isUrl(media.filePath)) {
      const fileName = createFileName('files', media.filePath);
      const s3FileUrl = await Service.S3.uploadFile(media.filePath, {
        fileName,
        ACL: options.ACL || 'public-read'
      });
      update.filePath = s3FileUrl.url;
      update.originalPath = s3FileUrl.url;
    }

    update.uploaded = true;
    await DB.Media.update({ _id: media._id }, {
      $set: update
    });

    // delete file
    removeLocalFile(media);
    done();
  } catch (e) {
    await Service.Logger.create({
      level: 'error',
      error: e,
      path: 'upload-s3'
    });
    done();
  }
});

exports.uploadS3 = async (media, options) => uploadQ.createJob({
  media: _.pick(media, ['_id', 'name', 'type', 'filePath', 'thumbPath', 'mediumPath', 'originalPath']),
  options
}).save();

exports.convertVideo = async video => mediaQ.createJob({
  command: 'convert-mp4',
  data: {
    _id: video._id,
    type: 'video',
    mediaId: video._id,
    filePath: video.filePath,
    originalPath: video.originalPath,
    uploaded: video.uploaded
  }
}).save();
