/* global $ */

$(document).ready(() => {
    
    $('.menu-category-card').on('click', (ev) => {
        let category = $(ev.currentTarget).find('.menu-category-desc').html().trim();
        
        $.ajax({
            'method': 'get',
            'url': '/api/getItems',
            'data': {
                'category': category
            },
            success: (data, status) => {
                console.log(data);
                
                // $('#item-card-container').html('');
                
                data.forEach( (row, i) => {
                    let itemImg = 'https://ipsumimage.appspot.com/250x150';
                    let itemName = 'Drink Name';
                    let itemDesc = 'Drink Description';
                    console.log('forEach: ', row);
                    
                    let htmlString = '';
                    
                    htmlString += `<div class='card menu-item-card d-flex flex-column text-center align-self-start m-3'>
                            <img class='card-img-top' src='${itemImg}'>
                            <div class='card-body'>
                                <div class='card-title'><h4>${itemName}</h4></div>
                                <div class='card-text text-left menu-item-desc'> 
                                    ${itemDesc}
                                </div>
                                <button class='btn btn-outline-primary m-1 menu-order-btn'>ORDER</button>
                                <!-- card order section -->
                                <div class='pt-2 menu-card-order-section' action="/addToCart">
                                    <select class='custom-select w-75 m-1 p-2'>`;
                                        // <option value='1'>small</option>
                                        // <option value='2' selected>medium</option>
                                        // <option value='3'>large</option>
                    htmlString +=   `</select>
                                    <div class='input-group'>
                                        <div class='input-group-prepend'>
                                            <button class='btn btn-secondary font-weight-bold px-3 menu-itm-qty-minus'>-</button>
                                        </div>
                                        <input class='form-control text-center w-50 menu-itm-qty' type='number' min='0' value='1'>
                                        <div class='input-group-append'>
                                            <button class='btn btn-secondary font-weight-bold px-3 menu-itm-qty-plus'>+</button>
                                        </div>
                                    </div>
                                    <button type='submit' class='btn btn-success m-1 menu-itm-add-btn'>ADD TO CART</button>
                                </div><!-- end of order section -->
                                
                            </div>
                        </div><!-- end of card -->`;
                    
                    $('#item-card-container').append(htmlString);
                });
                
            }
            
        });
    });
    
    $('#item-card-container').on('click', '.menu-order-btn', (ev) => {
        $('.menu-order-btn').show();
        $('.menu-item-desc').show();
        $('.menu-card-order-section').hide();
        $(ev.currentTarget).hide();
        $(ev.currentTarget).prev('.menu-item-desc').hide();
        $(ev.currentTarget).next('.menu-card-order-section').slideDown();
    });
    
    $('#item-card-container').on('click', '.menu-itm-qty-minus', (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.input-group').find('.menu-itm-qty');
        if(qtyInput.val() <= 0){return}
        let qty = Number(qtyInput.val()) - 1;
        qtyInput.val(qty);
    });
    
    $('#item-card-container').on('click', '.menu-itm-qty-plus', (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.input-group').find('.menu-itm-qty');
        let qty = Number(qtyInput.val()) + 1;
        qtyInput.val(qty);
    });
    
    $('#item-card-container').on('click', '.menu-itm-add-btn', (ev) => {
        ev.preventDefault();
        $('.menu-order-btn').show();
        $('.menu-item-desc').show();
        $('.menu-card-order-section').hide();
        $(ev.currentTarget).siblings('.input-group').find('.menu-itm-qty').val(1);
        $(ev.currentTarget).siblings('.custom-select').val(2);
    });
    
    
});