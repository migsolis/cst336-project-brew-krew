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

app.get('/admin', (req, res) => {
   res.render('admin'); 
});

// Returns all the items for a category
app.get('/api/getItems', (req, res) => {
    console.log('Get Items: ',Object.keys(req.query).length, req.query.status, req.query.category);
    let queryLength = Object.keys(req.query);
    let category = req.query.category;
    let status = req.query.status;
    let sqlParams = [];
    
    let sql = 'select item_id, category, items.description, img, description_details, price from items join categories on items.category = category_id';
    
    if(queryLength > 1 || category != 'All'){
        sql += ' where ';
    }
    
    if(category != undefined && category != 'All'){
        console.log('category selected: ', category);
        sql += ' categories.description = ?';
        sqlParams[sqlParams.length] = category;
    }
    
    if(status != undefined){
        console.log('status: ', status);
    }

    pool.query(sql, sqlParams, async (err, rows, fields) => {
      if(err) console.log(err);
      res.send({'displayedCategory': category, 'items': rows});
    });
}); // api get items

// returns the item-modifiers for an item
app.get('/api/getItemMods', (req, res) => {
    let sql = 'select * from modifiers join item_modifiers on modifiers.modifier_group = item_modifiers.modifier_group where item_modifiers.item = ?';
    let sqlParams = [req.query.item_id];
    pool.query(sql, sqlParams, (err, rows, fields) => {
        if(err) console.log(err);
        
        res.send(rows);
    });
}); // api get item mods

// returns updated price when size or qty change in the order section of an item card.
app.get('/api/update', (req, res) => {
    console.log("Update: ", req.query.action, );
    switch(req.query.action){
        case 'update':
            let sql = 'select price from menu_items where item_id = ? and modifier_id = ?';
            let sqlParams = [req.query.item_id, req.query.mod_id];
            pool.query(sql, sqlParams, (err, rows, fields) => {
                if(err) console.log(err);
                let price = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(rows[0].price * req.query.qty);
                res.send(price);
            });
            break;
        case 'add':
            
            break;
    }
}); // api update

app.get("/admin", isAuthenticated, function(req, res) {
   res.render("admin"); 
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
        res.render("admin");
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

//listener
app.listen(process.env.PORT, process.env.IP, ()=> {
    console.log('Server is running...');
})