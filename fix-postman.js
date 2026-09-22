const fs = require('fs');
const file = 'node_modules/postman-collection/lib/superstring/dynamic-variables.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/var faker = require\('@faker-js\/faker\/locale\/en'\)/, "var _fakerReq = require('@faker-js/faker/locale/en'); var faker = _fakerReq.faker || _fakerReq");
fs.writeFileSync(file, content);
