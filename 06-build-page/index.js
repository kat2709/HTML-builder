const fs = require('fs');
const path = require('path');
const destPath = path.join(__dirname, 'project-dist');

const OPEN_TMP_TAG = '{{';
const CLOSE_TMP_TAG = '}}';

async function main() {
  await fs.promises.rm(destPath, { force: true, recursive: true });
  await fs.promises.mkdir(destPath);

  const tasks = [
    // build HTML with templates
    buidHtml(
      path.join(__dirname, 'template.html'),
      path.join(__dirname, 'components'),
      path.join(destPath, 'index.html'),
    ),
    // bundle CSS files
    bundleCss(path.join(__dirname, 'styles'), path.join(destPath, 'style.css')),
    // copy assets
    copy(path.join(__dirname, 'assets'), path.join(destPath, 'assets')),
  ];
  try {
    await Promise.all(tasks);
  } catch (err) {
    console.log('Failed to build', err);
  }
}
main();

async function buidHtml(src, componentsDir, dest) {
  let buf = await fs.promises.readFile(src);
  const str = buf.toString();
  let prev = 0;
  let res = '';
  for (
    let i = str.indexOf(OPEN_TMP_TAG); // find first template tag
    i > 0 && i < str.length; // skan untill there is no more closing tags or the end of file
    i = str.indexOf(OPEN_TMP_TAG, i + 1) // move to the next template tag
  ) {
    // update "res" content up to openning template tag
    res += str.slice(prev, i);
    let j = str.indexOf(CLOSE_TMP_TAG, i + 1);
    // no end tag
    if (j === -1) {
      throw new Error(
        `Failed to build HTML template: expected closing template tag "${CLOSE_TMP_TAG}" coming after openning tag "${OPEN_TMP_TAG}"`,
      );
    }
    prev = j + 2;
    const component = str.slice(i + 2, j);
    const componentPath = path.join(componentsDir, component + '.html');
    try {
      await fs.promises.access(componentPath);
    } catch (err) {
      throw new Error(
        `Failed to find "${component}.html" in "${componentsDir}" directory`,
      );
    }
    // read component file
    const buf = await fs.promises.readFile(componentPath);
    // update resulting template string
    res += buf.toString();
  }
  // write the rest of the file
  res += str.slice(prev);
  // save resulting template string into a destination file
  try {
    await fs.promises.writeFile(dest, res);
  } catch (err) {
    throw new Error(`Failed to write into destination file "${dest}"`, err);
  }
}

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

async function copy(src, dest) {
  let stats;
  try {
    stats = await fs.promises.lstat(src);
  } catch (err) {
    console.log('Failed to read copy source', err);
    return;
  }

  // copy files
  if (stats.isFile()) {
    try {
      await fs.promises.copyFile(src, dest);
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
    await fs.promises.access(dest);
  } catch (err) {
    try {
      // does not exist - create directory
      await fs.promises.mkdir(dest);
    } catch (err) {
      console.log('failed to create destination directory', err);
    }
  }

  let files;
  try {
    files = await fs.promises.readdir(src);
  } catch (err) {
    console.log('Failed to read directory:', err);
    return;
  }
  for (let f of files) {
    // recursivery call copy for each file/directory
    copy(path.join(src, f), path.join(dest, f));
  }
}
