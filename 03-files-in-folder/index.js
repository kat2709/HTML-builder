const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'secret-folder');

fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.log('Failed to read directory:', err);
    return;
  }
  for (let f of files) {
    fs.stat(path.join(dirPath, f), (err, stats) => {
      if (err) {
        console.log('Failed to read file stats:', err);
        return;
      }
      if (!stats.isFile()) {
        return;
      }
      console.log(
        path.parse(f).name,
        '-',
        path.extname(f).slice(1),
        '-',
        parseFloat(stats.size / 1024, 10).toFixed(3),
        'KB',
      );
    });
  }
});
