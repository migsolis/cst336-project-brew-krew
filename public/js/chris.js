/* global $ */

$(document).ready(function () {
    
    var delItemNotFound = false;
    
    $("#date_options").hide();
    
	$("#item_id").on("change", function () {
	    let item_id = $("#item_id").val();
	    $.ajax({
	       method: 'get',
	       url: '/api/getItemInfo',
	       data: {
	          'item_id' : item_id 
	       },
	       success: (data, status) => {
	           if (data.noMatch === false) {
        	        // Change divs to add specific item info here: name, price, qty...
        	        $("#g_itemName").html("<strong>Item name:</strong> " + data.result[0].description);
        	        $("#g_itemPrice").html("<strong>Current price:</strong> " + data.result[0].price);	               
	           } else {
        	        $("#g_itemName").html("");
        	        $("#g_itemPrice").html("");	               
	           }
	       } 
	    });//AJAX
	    
	}); // onChange selection ID
	
    $("#del-item").on("change", () => {
        let item_id = $("#del-item").val();
        $.ajax({
	        method: 'get',
	        url: '/api/getItemInfo',
	        data: {
	            "item_id" : item_id  
	        },
	        success: (data, status) => {
	            if (data.noMatch === false || data.result[0] === "" ) {
	                $("#d-item-name").html("<strong>Item name</strong> " + data.result[0].description);
	                $("#d-item-price").html("<strong>Item price</strong> " + data.result[0].price);
                    $("#del-msg-info").html("")
	                delItemNotFound = false;
	            } else {
	                $("#d-item-name").html("");
	                $("#d-item-price").html("");
                    $("#del-msg-info").css("color", "red");
                    $("#del-msg-info").html("Error: Item not found!")
                    delItemNotFound = true;
	            }
	        }
        }); // AJAX
    }); // onChange del-item selection ID 	
	
	$("#s_order").change(function() {
	    if ($("#s_order").val() === "inventory" || $("#s_order").val() === "" ) {
	        $("#date_options").hide();
	    } else {
	        $("#date_options").show();
	    }
	}); // Hide date_options
	
	$("#form-db-mod").submit(function() {
        adminForm = new URLSearchParams(window.location.search);
        let price, stock;
        let sqlParams_s, sqlParams_p;
        let sql_p = "UPDATE items SET price = ? WHERE item_id = ?";
        // doesn't appear to be a column for stock at the moment..
        let sql_s = "UPDATE items SET stock = ? WHERE item_id = ?";

        if(adminForm.getAll() === undefined || adminForm.getAll().length == 0) {
            // Change some text to tell the user that both fields remain empty
            $("#mod-msg-info").html("Error! You need to supply a value to the stock or price form!");
            $("#mod-msg-info").css("color","red");
        } else {
            if(adminForm.has('price')) {
                price = adminForm.get('price');
                sqlParams_p = [price];
                sqlQuery(sql_p, sqlParams_p);
            }
            if(adminForm.has('stock')) {
                stock = adminForm.get('stock');
                sqlParams_s = [stock];
                sqlQuery(sql_s, sqlParams_s);
            }
        }
        
	});// form onsubmit
	
	// delete database entry 
	$("#delete_items").click(function() { 
        let item_id = $('#del-item').val();
        let description=$('#item_description').val();
        console.log(item_id);
        console.log(description);
        $.ajax({
                method: 'get',
                url: '/api/deleteitems',
                data: {
                    'action': "delete",
                    'item_id': item_id,
                    'description': description
                },
                success: (data, status) => {
                    console.log("success");
                    if (data.success === true && !delItemNotFound) {
                        $("#del-msg-info").css("color", "red");
                        $("#del-msg-info").html("The item was successfully deleted.")
                    } else {
                        if (!delItemNotFound) {
                            $("#del-msg-info").css("color", "red");
                            $("#del-msg-info").html("Error: You need to enter an item ID!");                            
                        }
                    }
                    // resolve(data);
                }
            }); // size modifier ajax call
    }); 
    
    // Change item price
	$("#commitprice").click(function(e) { 
        //// write click event here
        //alert("1");
        
        let item_id = $('#item_id').val();
        let price=$('#item_price').val();
        console.log(item_id);
        console.log(price);
        $.ajax({
                method: 'get',
                url: '/api/updateprice',
                data: {
                    'action': "update",
                    'item_id': item_id,
                    'price': price
                   
                },
               success: (data, status) => {
                      console.log("success");
                      $("#item_id").trigger('change');
                    //   resolve(data);
                   // $('#c-item_id').val("");
                   // $('#c-price').val("");
                }
            }); // end of updating api call
             return false; // size modifier ajax call
    });
    
    // add new items 
	$("#commitchanges").click(function(e) { 
       
        console.log("clciko");
        let description = $('#description').val();
        let category=$('#category').val();
        console.log(item_id);
        console.log(description);
        $.ajax({
                method: 'get',
                url: '/api/insertitems',
                data: {
                    'action': "insert",
                    'category': category,
                    'description': description
                   
                },
                success: (data, status) => {
                    console.log("success");
                    resolve(data);
                }
            }); // size modifier ajax call
    });
    
    $("#generatereports").click(function(e) { 
        // write click event here
       // alert("hello");
        //e.preventDefault();
        let startdate = $("#r-start-date").val();
        let enddate=$("#r-end-date").val();
        let sorder= $("#s_order").val();
        console.log(startdate);
        console.log(enddate);
        console.log(sorder);
        switch(sorder){
            case "open" :
                
                $.ajax({
                method: 'get',
                url: '/api/getOpenOrders',
                data: {
                    
                    'sdate': startdate,
                    'enddate': enddate
                },
                success: (data, status) => {
                    //resolve(data);
                    if(data.length != 0){
                    let htmlString = `<table style="width:100%" border="1"><tr><th>Order ID</th>
                    <th>Status</th><th>Location</th><th>First Name</th>
                    <th>Last Name</th><th>Email</th><th>Sub Total</th>
                    <th>Tax</th><th>Total</th><th>Date</th>`;
                    data.forEach((mod, i) => {
                    
                    htmlString += `<tr><td>${mod.order_id}</td>`;
                    htmlString += `<td>${mod.status}</td>`;
                    htmlString += `<td>${mod.location}</td>`;
                    htmlString += `<td>${mod.name_first}</td>`;
                    htmlString += `<td>${mod.name_last}</td>`;
                    htmlString += `<td>${mod.email}</td>`;
                    htmlString += `<td>${mod.subtotal}</td>`;
                    htmlString += `<td>${mod.tax}</td>`;
                    htmlString += `<td>${mod.total}</td>`;
                    htmlString += `<td>${mod.order_date}</td></tr>`;
                    
                    
                    });
                    htmlString += `</table>`;
                    
                    console.log(htmlString);
                    $('.modifier-section').html(htmlString);
                    }
                }
            }); // size modifier ajax call
                break;
            case "recent" :
                $.ajax ({
                    method: "get",
                    url: "/api/getRecentSales",
                    data: {
                        'sdate': startdate,
                        'enddate': enddate                        
                    },
                    success: (data, status) => {
                        let htmlString = `<table style="width:100%" border="1"><tr><th>Order ID</th>
                                            <th>Status</th><th>Location</th><th>First Name</th>
                                            <th>Last Name</th><th>Email</th><th>Sub Total</th>
                                            <th>Tax</th><th>Total</th><th>Date</th>`
                        if (typeof data.result != "undefined" && data.result != "") {
                            data.result.forEach((mod, i) => {
                                                            
                                htmlString += `<tr><td>${mod.order_id}</td>`;
                                htmlString += `<td>${mod.status}</td>`;
                                htmlString += `<td>${mod.location}</td>`;
                                htmlString += `<td>${mod.name_first}</td>`;
                                htmlString += `<td>${mod.name_last}</td>`;
                                htmlString += `<td>${mod.email}</td>`;
                                htmlString += `<td>${mod.subtotal}</td>`;
                                htmlString += `<td>${mod.tax}</td>`;
                                htmlString += `<td>${mod.total}</td>`;
                                htmlString += `<td>${mod.order_date}</td></tr>`;                                
                            });
                        }
                        htmlString += `</table>`;
                        
                        $('.modifier-section').html(htmlString);
                    }
                        
                
                }); // AJAX Recent
                break;
            case "inventory" :
                $.ajax ({
                    method: "get",
                    url: "/api/getCurrentInventory",
                    success: (data, status) => {
                        let htmlString = `<table style="width:100%" border="1"><tr><th>Item ID</th>
                                            <th>Description</th><th>Price</th><th>Status</th></tr>`
                        if(typeof data.result != "undefined" && data.result != "") {
                            data.result.forEach((mod, i) => {
                               htmlString += `<tr><td>${mod.item_id}</td>`;
                               htmlString += `<td>${mod.description}</td>`;
                               htmlString += `<td>${mod.price}</td>`;
                               htmlString += `<td>${mod.status}</td></tr>`;
                            });
                        }
                        htmlString += `</table>`;
                        
                        $('.modifier-section').html(htmlString);
                    }
                }); // AJAX inventory
                break;
        }
        
    });
	
}); // document