const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`INE Product Price Tracker Backend Server`);
  console.log(`Server listening on port: ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});
