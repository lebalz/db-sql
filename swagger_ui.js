const fs = require('fs');
const express = require('express');
const logger = require('morgan');


const app = express();

app.use(logger('combined'));
app.use(express.static('./swagger-ui-dist'));

app.listen(4000);
console.log('Visit http://localhost:4000');
