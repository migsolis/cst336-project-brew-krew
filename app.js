const express = require('express');
const app = express();
const pool = require('./dbPool.js');
const session = require('express-session');
const bcrypt = require('bcrypt');
const dateFormat = require('dateformat');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: "aBc1@3deF$",
    name: 'brewKrew',
    resave: true,
    saveUninitialized: true,
    path: "/"
}));

//routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get("/cart", async function (req, res) {
        res.render("cart");
});

app.get('/menu', (req, res) => {
    let sql = 'select description from categories';
    pool.query(sql, (err, rows, fields) => {
        if(err) console.log(err);
        
        let categoryArray = rows;
        res.render('menu', {'categoryArray': categoryArray});
    });
});

app.get('/login', (req, res)=> {
    res.render('login');
});

// Returns item info array for all items or specific items using filters.
app.get('/api/getItems', (req, res) => {
    // console.log('Get Items: ',Object.keys(req.query).length, req.query.status, req.query.category);
    let queryLength = Object.keys(req.query).length;
    let category = req.query.category;
    let status = req.query.status;
    let searchTerm = req.query.search;
    let sqlParams = [];
    
    let sql = 'select item_id, category, items.description, img, description_details, price, status from items ' +
        'join categories on items.category = category_id';
    
    if(queryLength > 0){
        sql += ' where ';
    }
    
    if(category != undefined && category != 'All'){
        // console.log('category selected: ', category);
        sql += ' categories.description = ?';
        sqlParams[sqlParams.length] = category;
    }
    
    if(status != undefined){
        // console.log('status: ', status);
        if(queryLength > 1){
            sql += ' &&';
        }
        sql += ' status = ?';
        sqlParams[sqlParams.length] = status;
    }
    
    if(searchTerm != undefined){
        // console.log('search: ', searchTerm);
        searchTerm = '%' + searchTerm + '%';
        sql += ' items.description like ? || items.description_details like ?';
        sqlParams[sqlParams.length] = searchTerm;
        sqlParams[sqlParams.length] = searchTerm;
    }

    pool.query(sql, sqlParams, async (err, rows, fields) => {
      if(err) console.log(err);
      res.send({'displayedCategory': category, 'items': rows});
    });
}); // api get items

// returns the item-modifiers for an item
app.get('/api/getItemMods', (req, res) => {
    let sql = 'select modifier_groups.description as "group_description", modifier_id, modifiers.description, price from modifiers ' +
        'join item_modifiers on modifiers.modifier_group = item_modifiers.modifier_group ' +
        'join modifier_groups on modifier_group_id = modifiers.modifier_group ' +
        'where item_modifiers.item = ? order by price';
    let sqlParams = [req.query.item_id];
    pool.query(sql, sqlParams, (err, rows, fields) => {
        if(err) console.log(err);
        let modifiers = {};
            rows.forEach((mod) => {
                if(modifiers[mod.group_description] == undefined){
                    modifiers[mod.group_description] = [];
                }
                modifiers[mod.group_description].push({'modifier_id': mod.modifier_id, 'description': mod.description});
                
            });
        
        res.send(modifiers);
    });
}); // api get item mods

// returns updated price when a modifier or qty change in the order section of an item card.
app.get('/api/update', (req, res) => {
    console.log("Update: ", req.query.action, req.query.data);
    let data = JSON.parse(req.query.data);
    let item_id = data.item_id;
    let mod_ids = data.mods;
    let qty = data.qty;
      
    let sql = 'select price from items where item_id = ?';
    let sqlParams = [item_id];
    
    if(mod_ids.length != 0){
        sql += ' union select price from modifiers where modifier_id in (?)';
        sqlParams[sqlParams.length] =  mod_ids;
    }
    
    pool.query(sql, sqlParams, (err, rows, fields) => {
        if(err) console.log(err);
        let sum = rows.reduce((acc, cur) => {return acc + cur.price}, 0);
        let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(sum * qty);
        res.send(price);
    });
}); // api update

// api getItemInfo
app.get('/api/getItemInfo', (req, res) => {
    let item_id = req.query.item_id;
	let sql = "SELECT * FROM items WHERE item_id = ?";
	let sqlParams = item_id;
	pool.query(sql,sqlParams, function (err, rows, fields) {
	    if (err) throw err;
	    if(typeof rows != "undefined" && rows != "") {
    	    let result = rows;
    	    let noMatch = false;
    	    res.send({"result" : result, "noMatch" : noMatch});	        
	    } else {
	        res.send({"noMatch" : true });
	    }
	});
}); //getItemInfo

// api add new entry 
app.get('/api/insertitems', (req, res) => {
    switch(req.query.action){
        case 'insert':
            const sql = `INSERT INTO items (category, description, price) VALUES (?, ?, ?)`;
            let sqlParams = [req.query.category, req.query.description, req.query.price];
            pool.query(sql, sqlParams, (err, rows, fields) => {
                if(err) console.log(err);
                res.send("success");
            });
            break;
       
    }
}); //end adding new entry

// returns the open orders
app.get('/api/getOpenOrders', (req, res) => {
    let sql = "select * from orders where status <= 2 and  order_date between  CAST( ? as DATE) and  CAST( ? as DATE) ";
    let sqlParams = [req.query.sdate,req.query.enddate];
    pool.query(sql, sqlParams, (err, rows, fields) => {
        if(err) console.log(err);
        
        res.send(rows);
    });
});

// Report log: Get Recent Sales
app.get('/api/getRecentSales', (req, res) => {
    let sql = "SELECT * FROM orders WHERE status > 1 AND order_date BETWEEN CAST( ? as DATE) AND CAST( ? as DATE)";
    let sqlParams = [req.query.sdate, req.query.enddate];
    pool.query(sql, sqlParams, (err, rows, fields) => {
        if (err) throw err;
        res.send({"result" : rows});
        
    }); // Query
}); // GetRecentSales

// Report log: Current inventory
app.get('/api/getCurrentInventory', (req, res) => {
    let sql = "SELECT * FROM items WHERE status = 1";
    pool.query(sql, (err, rows, fields) => {
        if (err) throw err;
        res.send({"result" : rows});
    }); // Query
}); // getCurrentInventory


// api update prices 
app.get('/api/updateprice', (req, res) => {
    console.log("Update: ", req.query.action, );
    switch(req.query.action){
        case 'update':
            let sql = "update items SET price = ?  where item_id = ?";
            let sqlParams = [req.query.price, req.query.item_id];
            pool.query(sql, sqlParams, (err, rows, fields) => {
                if(err) console.log(err);
                res.send("success");
            });
            break;
       
    }
}); //end of update price 

// api delete items  
app.get("/api/deleteitems", (req, res) => {
    if (typeof req.query.item_id != "undefined" && req.query.item_id != "") {
        console.log("Delete: " + req.query.action);
        console.log(req.query.item_id);
        switch(req.query.action){
            case 'delete':
                let sql = "DELETE FROM items WHERE item_id = ?";
                let sqlParams = req.query.item_id;
                pool.query(sql, sqlParams, (err, rows, fields) => {
                    if(err) throw (err);
                    res.send({"success" : true});
                });
                break;
        }// api update        
    } else {
        res.send({"success" : false});
    }

});

app.get("/api/cart/getcart", async function (req, res) {
    let lineSql = "SELECT order_lines.*,  items.img FROM order_lines JOIN items ON items.item_id = order_lines.item WHERE order_id = ? ORDER BY order_lines.order_line;";
    let modSql  = "SELECT * FROM order_line_modifiers WHERE order_id = ? ORDER BY order_line;";
    //let sqlParams = [req.query.orderId];
    let sqlParams = await getOrderId(req);
    let lineRows, modRows;
    return new Promise (function (resolve, reject) {
        pool.query(lineSql, sqlParams, function (err, rows, fields) {
                if (err) throw err;
                lineRows = rows;
                resolve(lineRows);
        });
    }).then(function(result) {
        pool.query(modSql, sqlParams, function (err, rows, fields) {
            if (err) throw err;
            modRows = rows;
            lineRows.forEach(function(row, i){
                let lineMods = []
                modRows.forEach(function(row2, x){
                    if(row2.order_line == row.order_line){
                        lineMods.push(row2);
                    }
                })
                row.item_mods = lineMods;
            })
            res.send(lineRows);
        });
    })
});

app.get("/api/cart/additem", async function(req, res){
    if(req.query.data){
        let itemData = JSON.parse(req.query.data);
        let itemInfo;
        let orderLineData = [];
        let modInfo = [];
    
        orderLineData.orderId = await getOrderId(req);
        orderLineData.orderLine = await getNextOrderLine(orderLineData.orderId);
    
        orderLineData.item  = itemData.item_id;
        orderLineData.qty   = itemData.qty;
        orderLineData.mods  = itemData.mods;
        
        if(!req.query.ins) {
            orderLineData.instructions = '';
        } else {
            orderLineData.instructions = req.query.ins;
        }
        
        itemInfo = await getItemDetails(orderLineData.item);
        orderLineData.description = itemInfo.description;
        orderLineData.itemPrice  = itemInfo.price;
        orderLineData.modifiersPrice = 0.00;
        
        for (let i = 0; i < orderLineData.mods.length; i++) {
             modInfo[i] = await  getModDetails(orderLineData.mods[i]);
        }
        
        for (let i = 0; i < modInfo.length; i++) {
              orderLineData.modifiersPrice += modInfo[i].price;
        }
        
        orderLineData.totalPrice = (orderLineData.itemPrice +  orderLineData.modifiersPrice) * orderLineData.qty;
        
        await writeOrderLine(orderLineData);
        
        for (let i = 0; i < modInfo.length; i++) {
              await writeOrderLineMod(orderLineData, modInfo[i]);
        }
        
        res.send("1");
        
    } else {
        
        res.send("0");
    }
    
});

app.get("/api/cart/deleteitem", async function(req, res){
    let modSql =  "DELETE FROM order_line_modifiers WHERE order_id = ? and order_line = ?";
    let lineSql = "DELETE FROM order_lines WHERE order_id = ? and order_line = ?";
    let sqlParams = [req.session.orderid, req.query.orderline];
    return new Promise (function (resolve, reject) {
        pool.query(modSql, sqlParams, function (err, rows, fields) {
                if (err) throw err;
                resolve(rows);
        });
    }).then(function(result) {
        pool.query(lineSql, sqlParams, function (err, rows, fields) {
            if (err) throw err;
            res.send(rows.affectedRows.toString());
        });
    });
});

app.get("/api/cart/locations", async function(req, res){
    let sql = "SELECT * FROM locations";
    return new Promise (function (resolve, reject) {
        pool.query(sql, function (err, rows, fields) {
                if (err) throw err;
                res.send(rows);
        });
    });
});

app.post("/submitorder", async function (req, res) {
    if(req.session.orderid) {
        let orderId = req.session.orderid;
        let orderLocation =  req.body.location;
        let orderTotal = req.body.total;
        let sql = "UPDATE orders SET status = ?, location = ?, name_first = ?, name_last = ?, email = ?, subtotal = ?, tax = ?, total = ?, order_date = ? WHERE order_id = ?";
        let sqlParams = [2, req.body.location, req.body.name_first, req.body.name_last,
        req.body.email, req.body.subtotal, req.body.tax, req.body.total, 
        dateFormat(Date.now(), "yyyy-mm-dd"), req.session.orderid];
        return new Promise (function (resolve, reject) {
            pool.query(sql, sqlParams, function (err, rows, fields) {
                if (err) throw err;
                req.session.destroy();
                res.render("confirmation", {"orderId": orderId, "location": orderLocation, "orderTotal": orderTotal}); 
            });
        });
    }
    res.redirect("cart");
});

app.get("/submitorder", async function (req, res) {
    res.redirect("cart");
});

// Admin panel options
app.get('/cpanel', isAuthenticated, function(req, res) {
   res.render("cpanel"); 
});

app.get("/dcreate", isAuthenticated, function(req, res) {
   res.render("dcreate"); 
});

app.get("/dupdate", isAuthenticated, function(req, res) {
   res.render("dupdate"); 
});

app.get("/ddelete", isAuthenticated, function(req, res) {
   res.render("ddelete"); 
});

app.get("/dreport", isAuthenticated, function(req, res) {
   res.render("dreport"); 
});

app.post("/login", async function(req, res){ 
    let username = req.body.uname;
    let password = req.body.pword;
    
    let result = await checkUsername(username);
    let hashedPwd = "";
    
    if (result.length > 0) {
        hashedPwd = result[0].password;
    }
    
    let passwordMatch = await checkPassword(password, hashedPwd);
    
    if (passwordMatch) {
        req.session.authenticated = true;
        if(isAdmin(username)) {
            // cpanel render for admin only
            res.render("cpanel");    
        } else {
            res.redirect("/");
        }
    } else {
        res.render("login", {"loginError":true});
    }
}); // POST login form

app.get('/logout', (req, res) => {
    console.log('logout: ', req.session);
    req.session.authenticated = false;
    res.redirect('/');
});

app.get('/isAuthenticated', (req, res) => {
    res.send({"isAuthenticated": req.session.authenticated});
});


// functions
function checkUsername(username) {
    let sql = "SELECT * FROM users WHERE username = ?";
    return new Promise(function(resolve, reject) {
       pool.query(sql, [username], function(err, rows, fields) {
          if (err) throw err;
          resolve(rows);
       }); // query
    }); // promise
}

function checkPassword(password, hashedVal) {
    return new Promise(function(resolve, reject) {
       bcrypt.compare(password, hashedVal, function(err, result) {
          if (err) throw err;
          resolve(result); 
       }); // bcrypt check
    }); // promise
}

function isAuthenticated(req, res, next) {
    if (!req.session.authenticated) {
        res.redirect('/login')
    } else {
        next();
    }
} // isAuthenticated

function isAdmin(username) {
    // Hardcoded into username, for future should make admin group in DB
    if (username === 'admin') {
        return true;
    } else {
        return false;
    }
} // isAdmin

function getOrderId(req){
    return new Promise (function (resolve, reject) {
        //check to see if order exsits
        if (!req.session.orderid){
            //start new order
            let sql = "INSERT INTO orders (status, order_date) VALUES (1,?); SELECT LAST_INSERT_ID() AS order_id;";
            let sqlParams = [dateFormat(Date.now(), "yyyy-mm-dd")];  
            pool.query(sql, sqlParams, function (err, rows, fields) {
                if (err) throw err;
                req.session.orderid = rows[1][0].order_id;
                resolve(req.session.orderid);
            });  
        } else {
            resolve(req.session.orderid);
        }
    });
}

function getNextOrderLine(orderId){
    return new Promise (function (resolve, reject) {
        let orderLine = 1;
        //check for last order line
        let sql = "SELECT MAX(order_line) AS order_line FROM order_lines WHERE order_id = ?";
        let sqlParams = [orderId];  
        pool.query(sql, sqlParams, function (err, rows, fields) {
            if (err) throw err;
            if(rows[0].order_line != null){
                orderLine = rows[0].order_line + 1;
            }
            resolve(orderLine);
        });  
    });
}

function getItemDetails(item){
    return new Promise (function (resolve, reject){
        let sql = "SELECT * FROM items WHERE item_id = ?";
        let sqlParams = [item];  
        pool.query(sql, sqlParams, function (err, rows, fields) {
            if (err) throw err;
            resolve(rows[0]);
        });
    });
}

function getModDetails(mod){
    return new Promise (function (resolve, reject){
        let sql = "SELECT * FROM modifiers WHERE modifier_id = ?";
        let sqlParams = [mod];
        pool.query(sql, sqlParams, function (err, rows, fields) {
            if (err) throw err;
            resolve(rows[0]);
        });
    });
}

function writeOrderLine(orderLineData){
    return new Promise (function (resolve, reject){
        let sql = "INSERT INTO order_lines (order_id, order_line, item, description, qty, "
            + "item_price, modifiers_price, total_price, instructions) VALUES (?,?,?,?,?,?,?,?,?);";
        let sqlParams = [orderLineData.orderId, orderLineData.orderLine, orderLineData.item, 
            orderLineData.description, orderLineData.qty, orderLineData.itemPrice, 
            orderLineData.modifiersPrice, orderLineData.totalPrice, orderLineData.instructions];  
        pool.query(sql, sqlParams, function (err, rows, fields) {
            if (err) throw err;
            resolve(rows[0]);
        });
    });
}

function writeOrderLineMod(lineData, modData){
    return new Promise (function (resolve, reject){
        let sql = "INSERT INTO order_line_modifiers (order_id, order_line, modifier, description, price) VALUES (?,?,?,?,?);";
        let sqlParams = [lineData.orderId, lineData.orderLine, modData.modifier_id, modData.description, modData.price];  
        pool.query(sql, sqlParams, function (err, rows, fields) {
            if (err) throw err;
            resolve(rows[0]);
        });
    });
}

function getOrderData(orderId){
    return new Promise (function (resolve, reject) {
        let sql = "SELECT * FROM orders WHERE order_id = ?";
        let sqlParams = [orderId];  
        pool.query(sql, sqlParams, function (err, rows, fields) {
            if (err) throw err;
            resolve(rows[0]);
        });  
    });
}

//listener
app.listen(process.env.PORT, process.env.IP, ()=> {
    console.log('Server is running...');
})