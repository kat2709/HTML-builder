const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'styles');
const destPath = path.join(__dirname, 'project-dist', 'bundle.css');

bundleCss(srcPath, destPath);

async function bundleCss(src, dest) {
  let stats;
  try {
    stats = await fs.promises.lstat(src);
  } catch (err) {
    console.log('Failed to read source', err);
    return;
  }
  // source is a file - just copy file
  if (stats.isFile()) {
    try {
      await fs.promises.copyFile(src, dest);
    } catch (err) {
      console.log('Failed to copy file', err);
      return;
    }
    return;
  }
  // ignore if not a directory
  if (!stats.isDirectory()) {
    return;
  }

  // read files from a source directory
  let files;
  try {
    files = await fs.promises.readdir(src);
  } catch (err) {
    console.log('Failed to read directory:', err);
    return;
  }

  // create a write stream
  // flag "w" to write to a file (not to append to it)
  const ws = fs.createWriteStream(dest, { flags: 'w' });
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const srcFilePath = path.join(src, f);
    let stats;
    try {
      stats = await fs.promises.lstat(srcFilePath);
    } catch (err) {
      console.log('Failed to read source file', err);
      return;
    }
    // skip everything but files with ".css" extention
    if (!stats.isFile() || path.extname(srcFilePath) !== '.css') {
      continue;
    }
    // create a read stream and write data into a destination file
    const rs = fs.createReadStream(srcFilePath);
    try {
      // promise is to ensure that we write files one by one
      await new Promise((res, rej) => {
        rs.on('data', (data) => ws.write(data));
        rs.on('error', (err) => {
          rs.close();
          rej(err);
        });
        rs.on('end', () => {
          rs.close();
          res();
        });
      });
    } catch (err) {
      ws.close();
      return;
    }
  }
  ws.close();
}
