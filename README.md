### Basics

Don't forget to run `npm install`

If electron won't launch run `npm update`

### Configure database connection for every entity:

```
const mysql = require('mysql');
const database = mysql.createConnection({
    host: 'localhost',
    port: '8889',
    user: 'root',
    password: 'root',
    database: 'gunshop'
});
database.connect();
```

### Configure entity:

```
// Environment configuration
// If table name is one of the reserved SQL names, surround with apostrophes
const table = 'buyer';
// Property may be a table column, but if property is calculated add it manually to selectQuery at SelectAll() function.
// Example: Order implementation.
const properties = [
    'name',
    'surname',
];
const titles = {
    name: 'Name',
    surname: 'Surname',
};
// Available rules:
// '' - empty rule means string/text.
// 'integer' or 'integer-unsigned'
// 'float' or 'float-unsigned'
// 'currency' or 'currency-unsigned' - same as float, but up to 2 symbols after floating point
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Look for rules implementation at the end of the file, under 'Validation' comment. Extend if needed.
// Rules can be applied to inputs as class names; Example: filter inputs.
const rules = {
    name: '',
    surname: '',
};
// Filter configuration: HAVING or WHERE
const filterOperator = 'WHERE';
```

Mostly everything is generated depending on the entity configuration, so most of the stuff have to suffice. If needed freely implement something explicit.
