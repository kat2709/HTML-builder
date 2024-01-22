const fs = require('fs').promises;
const path = require('path');

const srcPath = path.join(__dirname, 'files');
const destPath = path.join(__dirname, 'files-copy');

async function main() {
  try {
    await fs.rm(destPath, { recursive: true, force: true });
  } catch (err) {
    console.log('Failed to remove destination directory', err);
    return;
  }
  copy(srcPath, destPath);
}
main();

async function copy(src, dest) {
  let stats;
  try {
    stats = await fs.lstat(src);
  } catch (err) {
    console.log('Failed to read copy source', err);
    return;
  }

  // copy files
  if (stats.isFile()) {
    try {
      await fs.copyFile(src, dest);
    } catch (err) {
      console.log('Failed to copy file', err);
      return;
    }
    return;
  }

  // ignore if not directory
  if (!stats.isDirectory()) {
    return;
  }
  try {
    // check if destination directory exists
    await fs.access(dest);
  } catch (err) {
    try {
      // does not exist - create directory
      await fs.mkdir(dest);
    } catch (err) {
      console.log('failed to create destination directory', err);
    }
  }

  let files;
  try {
    files = await fs.readdir(src);
  } catch (err) {
    console.log('Failed to read directory:', err);
    return;
  }
  for (let f of files) {
    // recursivery call copy for each file/directory
    copy(path.join(src, f), path.join(dest, f));
  }
}
