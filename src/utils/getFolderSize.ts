import path_module from 'path';
import fs from 'fs';

// computes a size of a filesystem folder (or a file)
async function dirSize(path: any, callback: any) {
  fs.lstat(path, function (error, stats) {
    if (error) {
      return callback(error);
    }

    if (!stats.isDirectory()) {
      return callback(undefined, stats.size);
    }

    let total = stats.size;

    fs.readdir(path, function (error, names) {
      if (error) {
        return callback(error);
      }

      let left = names.length;

      if (left === 0) {
        return callback(undefined, total);
      }

      function done(size: any) {
        total += size;

        left--;
        if (left === 0) {
          callback(undefined, total);
        }
      }

      for (let name of names) {
        dirSize(path_module.join(path, name), function (error: any, size: any) {
          if (error) {
            return callback(error);
          }
          done(size);
        });
      }
    });
  });
}

export function convertBytes(bytes: number) {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else if (bytes < 1073741824) {
    return (bytes / 1048576).toFixed(2) + ' MB';
  } else if (bytes < 1099511627776) {
    return (bytes / 1073741824).toFixed(2) + ' GB';
  } else {
    return (bytes / 1099511627776).toFixed(2) + ' TB';
  }
}

async function getFolderSize(path: string) {
  return new Promise((resolve, reject) => {
    dirSize(path, async (err: any, size: number) => {
      if (err) {
        return reject(err);
      }
      const totalSize = convertBytes(size);
      return resolve(totalSize);
    });
  });
}

export default getFolderSize;
