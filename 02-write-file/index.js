const fs = require('fs');
const path = require('path');
const readline = require('readline');

const filePath = path.join(__dirname, 'text.txt');
const ws = fs.createWriteStream(filePath);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.on('close', () => {
  console.log('Closing... (farewell phrase)');
  ws.close();
  rl.close();
});

function listen() {
  rl.question('Please enter some text:\n', (text) => {
    if (text.trim() === 'exit') {
      ws.close();
      rl.close();
      return;
    }
    ws.write(text + '\n');
    listen();
  });
}

listen();
