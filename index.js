require('dotenv/config')
const app = require('./app');

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log('Express server démarré sur le port ' + port);
});