const express = require('express');
const app = express();
const pool = require('./dbPool.js');
const session = require('express-session');
const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: "aBc1@3deF$",
    resave: true,
    saveUninitialized: true
}));

//routes
app.get('/', (req, res) => {
    res.render('index');
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

// returns updated price when size or qty change in the order section of an item card.
app.get('/api/update', (req, res) => {
    // console.log("Update: ", req.query.action, req.query.vars);
    let vars = JSON.parse(req.query.vars);
    let item_id = vars.item_id;
    let mod_ids = vars.mods;
    let qty = vars.qty;
    switch(req.query.action){
        case 'update':
            let sql = 'select price from items where item_id = ? union select price from modifiers where modifier_id in (?)';
            let sqlParams = [item_id, mod_ids];
            pool.query(sql, sqlParams, (err, rows, fields) => {
                if(err) console.log(err);
                let sum = rows.reduce((acc, cur) => {return acc + cur.price}, 0);
                let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(sum * qty);
                res.send(price);
            });
            break;
        case 'add':
            
            break;
    }
}); // api update

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
    
    console.log(username);
    
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
    console.log(password + " : " + hashedVal);
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

//listener
app.listen(process.env.PORT, process.env.IP, ()=> {
    console.log('Server is running...');
})