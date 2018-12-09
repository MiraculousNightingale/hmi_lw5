const mysql = require('mysql');
const database = mysql.createConnection({
    host: 'localhost',
    port: '8889',
    user: 'root',
    password: 'root',
    database: 'gunshop'
});
database.connect();

// Environment configuration
// If table name is one of the reserved SQL names, surround with apostrophes
const table = 'weapon';
// Property may be a table column, but if property is calculated add it manually to selectQuery at SelectAll() function.
// Example: Order implementation.
const properties = [
    'brand',
    'model',
    'caliber',
    'type',
    'price',
];
const titles = {
    brand: 'Brand',
    model: 'Model',
    caliber: 'Caliber',
    type: 'Type',
    price: 'Price',
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
    brand: '',
    model: '',
    caliber: '',
    type: '',
    price: 'currency-unsigned',
};
// Filter configuration: HAVING or WHERE
const filterOperator = 'WHERE';




// Everything below can be used for any other simple entity.
// Order implements many-to-many relationship so it differs.

function SelectAll(append = ``) {
    let selectQuery = `SELECT * from ${table}` + append;
    database.query(selectQuery, function (err, rows, fields) {
        //debug
        console.log(`${new Date()}\n${selectQuery}`);
        let html = '';
        rows.forEach(row => {
            html += `<tr id="${table}-${row.id}">`;

            properties.forEach((property) => {
                html += `<td><input id="${property}" class="form-control ${rules[property]}" type="text" value="${row[property]}"/></td>`;
            });

            html += `<td><li class="edit-btn btn btn-warning"  id="${row.id}">Edit</li></td>
            <td><li class="del-btn btn btn-danger" id="${row.id}"  href="#" >Delete</li></td>
            </tr>`
        });

        document.querySelector('#table > tbody').innerHTML = html;
        InitializeEvents();
    });
}

function Insert() {
    let insertQuery = `INSERT INTO ${table} VALUES (NULL, `;
    properties.forEach(property => {
        let value = document.getElementById(property).value;
        insertQuery += `"${value}", `;
    });
    //cut off the odd ', ' separator
    insertQuery = insertQuery.slice(0, -2);
    insertQuery += `)`;
    //debug
    console.log(`${new Date()}\n${insertQuery}`);
    database.query(insertQuery);
}

// Sorting
let currentOrder = '';
let orderQuery = ``;

function Sort(property) {
    orderQuery = ` ORDER BY ${property} `;
    if (currentOrder === `ASC`) {
        orderQuery += `DESC`;
        currentOrder = `DESC`;
    } else {
        orderQuery += `ASC`;
        currentOrder = `ASC`;
    }
    FullSelect();
}

let whereQuery = ``;

function Filter() {
    whereQuery = ` ${filterOperator} `;
    properties.forEach(property => {
        let filter = document.getElementById(`${property}-Filter`);
        if (IsString(property)) {
            whereQuery += `${property} LIKE "%${filter.value}%" AND `;
        } else {
            if (filter.value !== '') {
                whereQuery += `${property} = "${filter.value}" AND `;
            } else {
                whereQuery += `${property} LIKE "%${filter.value}%" AND `;
            }
        }
    });
    //cut off the odd 'AND ' separator
    whereQuery = whereQuery.slice(0, -4);
    FullSelect();
}

function FullSelect() {
    SelectAll(whereQuery + orderQuery);
}

function DeleteEvents() {
    let deleteButtons = document.querySelectorAll("li.del-btn");
    deleteButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            let deleteQuery = `DELETE FROM ${table} WHERE id = ${this.id}`;
            //debug
            console.log(`${new Date()}\n${deleteQuery}`);
            database.query(deleteQuery);
            location.reload();
        });
    });
}

function EditEvents() {

    let editButtons = document.querySelectorAll("li.edit-btn");

    editButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            let editQuery = `UPDATE ${table} SET `;
            properties.forEach(property => {
                let value = document.querySelector(`#${table}-${this.id} #${property}`).value;
                editQuery += `${property} = "${value}", `;
            });
            //cut off the odd ', ' separator
            editQuery = editQuery.slice(0, -2);
            editQuery += ` WHERE id = ${this.id}`;
            //debug
            console.log(`${new Date()}\n${editQuery}`);
            database.query(editQuery);
        });
    });
}

function InitializeEvents() {
    ValidationEvents();
    DeleteEvents();
    EditEvents();
}

// Generate HTML

function GenerateTable() {
    RenderHeaders();
    RenderFilters();
}

function RenderHeaders(container = document.getElementById('table-headers')) {
    container.innerHTML = ``;
    properties.forEach(property => {
        container.innerHTML += `<th class="btn-outline-success" scope="col" onclick="Sort('${property}')">${titles[property]}</th>`;
    });
    container.innerHTML += `<th scope="col">Edit</th>`;
    container.innerHTML += `<th scope="col">Delete</th>`;
}

function RenderFilters(container = document.getElementById('table-filters')) {
    container.innerHTML = ``;
    properties.forEach(property => {
        container.innerHTML += `<td><input id="${property}-Filter" class="form-control ${rules[property]}" type="text" onmouseleave="Filter()"></td>`;
    });
    container.innerHTML += `<td></td>`;
    container.innerHTML += `<td></td>`;
}

function GenerateForm(container = document.getElementById('create-form')) {
    container.innerHTML = ``;
    properties.forEach(property => {
        container.innerHTML += `<h5>${titles[property]}</h5>`;
        container.innerHTML += `<input id="${property}" class="form-control form-group ${rules[property]}" type="text">`;
    });
}

// Validation

//  To implement more validators.
//  /^-?\d*$/                restricts input to integer numbers
//  /^\d*$/                  restricts input to unsigned integer numbers
//  /^[0-9a-f]*$/i           restricts input to hexadecimal numbers
//  /^-?\d*[.,]?\d*$/        restricts input to floating point numbers (allowing both . and , as decimal separator)
//  /^\d*[.,]?\d*$/          restricts input to unsigned floating point numbers (allowing both . and , as decimal separator)
//  /^-?\d*[.,]?\d{0,2}$/    restricts input to currency values (i.e. at most two decimal places)
//  /^\d*[.,]?\d{0,2}$/      restricts input to unsigned currency values (i.e. at most two decimal places)

function ValidationEvents() {
    document.querySelectorAll('.integer-unsigned').forEach(input => {
        setInputFilter(input, function (value) {
            return /^\d*$/.test(value);
        });
    });

    document.querySelectorAll('.float-unsigned').forEach(input => {
        setInputFilter(input, function (value) {
            return /^\d*[.,]?\d*$/.test(value);
        });
    });

    document.querySelectorAll('.currency-unsigned').forEach(input => {
        setInputFilter(input, function (value) {
            return /^\d*[.,]?\d{0,2}$/.test(value);
        });
    });
}

/**
 * @return {boolean}
 */
function IsString(property) {
    return rules[property] === '';
}

function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            }
        });
    });
}
