const fs = require('fs');
const path = require('path');
// console.log(__dirname); // pwd print working directory
const filePath = path.join(__dirname, './text.txt');
// console.log(filePath);

const readStream = fs.createReadStream(filePath);
readStream.on('data', (chunk) => {
  console.log(chunk.toString());
});
readStream.on('error', (err) => {
  console.log(err);
});
