const { exec } = require('child_process');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Make, delete recursively, and then make again to garbage collect
fs.mkdirSync('server/data', { recursive: true });
fs.rmSync('server/data', { recursive: true });
fs.mkdirSync('server/data');
fs.mkdirSync('server/saved', { recursive: true });

const app = express();

app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/file/:name', (req, res) => {
  const options = {
    root: path.join(__dirname, './data'),
    dotfiles: 'deny',
  };
  res.sendFile(req.params.name, options);
});

app.get('/:name', (req, res) => {
  res.send();
});

app.get('/saved/:name', (req, res) => {
  const options = {
    root: path.join(__dirname, './saved'),
    dotfiles: 'deny',
  };
  res.sendFile(req.params.name, options);
});

app.post('/newfile', (req, res) => {
  console.log('generating a new file');
  const { key } = req.body;
  const id = req.body.id || String(Math.random()).slice(2);
  exec(`python ./server/voiceleading.py ${key} ${id}`, (err, results) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.send({ results, id });
    }
  });
});

app.post('/savefile/:code', (req, res) => {
  const oldPath = `server/data/${req.params.code}.mid`;
  const newPath = `server/saved/${req.params.code}.mid`;
  fs.rename(oldPath, newPath, (err, results) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      // TODO: Redirect to /saved
      res.send(results);
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port);
