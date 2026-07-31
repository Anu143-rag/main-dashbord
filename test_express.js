const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.cookie('test', 'value', { httpOnly: true });
  res.send('ok');
});
app.listen(3001, () => {
  console.log('Test server on 3001');
  fetch('http://localhost:3001').then(r => {
    console.log(r.headers.get('set-cookie'));
    process.exit(0);
  });
});
