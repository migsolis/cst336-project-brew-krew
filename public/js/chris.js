/* global $ */

$(document).ready(function () {
    
    //Global variables
    var itemNotFound = false;
    var addFieldsBlank = true;
    
    // Pre-populate item details on modify DB page ------------
    if($("#item_id").length) {
        getItemInfo();
    }
    // --------------------------------------------------------

    $("#date_options").hide();
    
	$("#item_id").on("change", function () {
        getItemInfo();
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
	            if (data.noMatch === false && typeof data.result != "undefined") {
	                console.log("false");
	                $("#d-item-name").html("<strong>Item name</strong> " + data.result[0].description);
	                $("#d-item-price").html("<strong>Item price</strong> " + data.result[0].price);
                    $("#del-msg-info").html("");
	                itemNotFound = false;
	            } else {
	                if (item_id != "") {
    	                $("#d-item-name").html("");
    	                $("#d-item-price").html("");
                        $("#del-msg-info").css("color", "red");
                        $("#del-msg-info").html("Error: Item not found!");
                        itemNotFound = true;	                    
	                } else {
                        $("#del-msg-info").html("");	                    
	                }

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
                    if (data.success === true && !itemNotFound) {
                        $("#del-msg-info").css("color", "red");
                        $("#del-msg-info").html("The item was successfully deleted.");
                    } else {
                        if (!itemNotFound) {
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
        let item_id = $('#item_id').val();
        let price=$('#item_price').val();
        
        var regexPrice = new RegExp(/^\d*(\.\d{0,2})?$/);
        // Test that price uses correct decimal inputs
        if (regexPrice.test(price) && price != "" && !itemNotFound) {
            $("#it-price-msg").html("");
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
        } else {
            if(!itemNotFound) {
                $("#it-price-msg").css("color", "red");
                $("#it-price-msg").html("Error: Invalid decimal value for new price.");                
            } else {
                $("#it-price-msg").css("color", "red");
                $("#it-price-msg").html("Error: Cannot update nonexistent item.");
            }

        }

    });
    
    // add new items 
	$("#insertitems").click(function(e) {
	    let areFieldsBlank = toggleFieldsBlank();
	    console.log("Blank fields?: " + areFieldsBlank);
	    if (areFieldsBlank != true) {
            let description = $('#c-itemName').val();
            let category = $('#c-itemCat').val();
            let price = $("#c-itemPrice").val();
            
            var regexPrice = new RegExp(/^\d*(\.\d{0,2})?$/);
            
            if(regexPrice.test(price)) {
                $("#add-msg-info").html("New item added successfully!");
                $("#a-itemPrice").html(""); 
                $.ajax({
                        method: 'get',
                        url: '/api/insertitems',
                        data: {
                            'action': "insert",
                            'category': category,
                            'description': description,
                            "price" : price
                        },
                        success: (data, status) => {
                            
                        }
                    }); // size modifier ajax call	                 
            } else {
                $("#a-itemPrice").css("color", "red");
                $("#a-itemPrice").html("Error: Invalid decimal value for new price."); 
            }
	    } else {
	        $("#add-msg-info").css("color", "red");
	        $("#add-msg-info").html("Error: No field must be left blank!");
	    }

    });
    
    $("#generatereports").click(function(e) { 
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
                                            <th>Tax</th><th>Total</th><th>Date</th>`;
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
                                            <th>Description</th><th>Price</th><th>Status</th></tr>`;
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

// Functions

    function toggleFieldsBlank() {
        if ($("#c-itemName").val() != "" && $("#c-itemPrice").val() != "" && $("#c-itemCat").val() != "") {
            return false;
        } else {
            return true;
        }
    }
    
	function getItemInfo() {
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
        	        $("#f-item-msg").html("");
        	        $("#g_itemName").html("<strong>Item name:</strong> " + data.result[0].description);
        	        $("#g_itemPrice").html("<strong>Current price:</strong> " + data.result[0].price);
        	        itemNotFound = false;
	           } else {
	               if (item_id != "") {
            	        $("#g_itemName").html("");
            	        $("#g_itemPrice").html("");
                        $("#f-item-msg").css("color", "red");
                        $("#f-item-msg").html("Error: Item not found!");
            	        itemNotFound = true;	                   
	               } else {
	                    $("#f-item-msg").html("");
	                    $("#g_itemName").html("");
            	        $("#g_itemPrice").html("");
	               }
	           }
	       } 
	    });//AJAX        
    }

}); // document