require('dotenv').config()
const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

require("./api/routes/analyticsRouter.js")(app)
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
