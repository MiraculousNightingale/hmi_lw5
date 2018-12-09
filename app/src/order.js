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
// In this entity the configuration is kind of irrelevant.
// If table name is one of the reserved SQL names, surround with apostrophes
const table = '\`order\`';
// Property may be a table column, but if property is calculated add it manually to selectQuery at SelectAll() function.
// Example: Order implementation.
const properties = [
    'buyer',
    'weapon_distinct',
    'weapon_count',
    'total_price',
];
const titles = {
    buyer: 'Buyer',
    weapon_distinct: 'Distinct Weapons',
    weapon_count: 'Weapons Total',
    total_price: 'Total price',
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
    buyer: '',
    weapon_distinct: 'integer-unsigned',
    weapon_count: 'integer-unsigned',
    total_price: 'currency-unsigned',
};
// Filter configuration: HAVING or WHERE
const filterOperator = 'HAVING';


// Order implementation differs from others, as it implements many-to-many relationship

function SelectAll(append = ``) {
    let oneHugeFuckingQuery = `SELECT
    order.id, 
    CONCAT(buyer.name,' ',buyer.surname) AS buyer, 
    COUNT(order_item.id) as weapon_distinct, 
    SUM(order_item.count) as weapon_count, 
    SUM(weapon.price) as total_price 
    FROM \`order\` 
    JOIN buyer ON buyer.id=order.buyer_id 
    JOIN order_item ON order.id=order_item.order_id 
    JOIN weapon ON weapon.id=order_item.weapon_id 
    GROUP BY order.id`
        + append;
    database.query(oneHugeFuckingQuery, function (err, rows, fields) {
        console.log(`${new Date()}\n${oneHugeFuckingQuery}`);
        let html = '';
        rows.forEach(row => {
            html += `<tr id="${table}-${row.id}">`;

            properties.forEach((property) => {
                // html += `<td><input id="${property}" class="form-control ${rules[property]}" type="text" value="${row[property]}"/></td>`;
                html += `<td>${row[property]}</td>`;
            });

            html += `<td><li class="edit-btn btn btn-warning"  id="${row.id}" href="order-edit.html">Edit</li></td>
            <td><li class="del-btn btn btn-danger" id="${row.id}">Delete</li></td>
            </tr>`
        });

        document.querySelector('#table > tbody').innerHTML = html;
        InitializeEvents();
    });
}

function Insert() {
    // Insert Order
    let buyer_select = document.getElementById('buyer-select');
    let buyer = buyer_select.options[buyer_select.selectedIndex].value;
    let insertQuery = `INSERT INTO ${table} VALUES (NULL, "${buyer}")`;
    // Can't be used with this table
    // properties.forEach(column => {
    //     let value = document.getElementById(column).value;
    //     insertQuery += `"${value}", `;
    // });
    //cut off the odd ', ' separator
    // insertQuery = insertQuery.slice(0, -2);
    // insertQuery += `)`;
    database.query(insertQuery);

    database.query(`SELECT id FROM \`order\` ORDER BY id DESC LIMIT 1`, function (err, rows, fields) {
        // In case the query doesn't return rows, SQL will throw exception about '-1' id.
        let order = -1;
        rows.forEach(row => {
            order = row.id;
        });
        for (let i = 0; i < weaponCount; i++) {
            let weapon_select = document.querySelector(`#weapon-${i} #weapon-select`);
            let weapon = weapon_select.options[weapon_select.selectedIndex].value;
            let count = document.querySelector(`#weapon-${i} #count`).value;
            let insertQuery = `INSERT INTO order_item VALUES (NULL, "${order}","${weapon}","${count}")`;
            database.query(insertQuery);
        }
    });
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
            database.query(deleteQuery);
            location.reload();
        });
    });
}


function InitializeEvents() {
    ValidationEvents();
    DeleteEvents();
}

function LoadBuyerSelect() {
    let html = '';
    database.query(`SELECT * FROM buyer`, (err, rows, fields) => {
        rows.forEach(row => {
            html += `<option value="${row.id}">${row.name} ${row.surname}</option>`
        });
        document.getElementById('buyer-select').innerHTML = html;
    });
}

// Many-to-many form generation
let weaponCount = 0;

function AddWeapon() {
    let container = document.getElementById('weapon-container');
    container.innerHTML += `
                <div class="form-group" id="weapon-${weaponCount}">
                    <h5 class="float-left">Weapon ${weaponCount + 1}</h5>
                    <button class="btn btn-danger float-right m-1" id="${weaponCount}" onclick="RemoveWeapon()">Remove</button>
                    <select class="form-control form-group" id="weapon-select"></select>
                    <input id="count" class="form-control form-group integer-unsigned" min="0" type="text"
                           placeholder="Count" required>
                </div>`;

    let weapon_select = document.querySelector(`#weapon-${weaponCount} > select`);
    database.query(`SELECT * FROM weapon`, function (err, rows, fields) {
        let html = '';
        rows.forEach(row => {
            html += `<option value="${row.id}">${row.brand} ${row.model}</option>`
        });
        weapon_select.innerHTML = html;
    });
    weaponCount++;
    ValidationEvents();
}

function RemoveWeapon(id) {
    document.getElementById(`weapon-${id}`).remove();
    weaponCount--;
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