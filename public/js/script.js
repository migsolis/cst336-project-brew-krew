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
                $('.displaySelectedCategory').html(data.displayedCategory);
                $('#item-card-container').html('');
                
                data.items.forEach( (item, i) => {
                    let itemImg = 'https://ipsumimage.appspot.com/250x150';
                    let itemName = 'Drink Name';
                    let itemDesc = 'Drink Description';
                    console.log('forEach: ', item);
                    
                    let htmlString = '';
                    
                    htmlString += `<div class='menu-item-card'>
                            <img class='menu-item-img' src='${itemImg}'>
                            <div class='menu-item-card-body'>
                                <div class='menu-item-title'><h4>${itemName}</h4></div>
                                <div class='menu-item-desc'> 
                                    ${itemDesc}
                                </div>
                                <button class='menu-item-order-btn'>ORDER</button>
                                <!-- card order section -->
                                <div class='menu-item-order-section' action="/addToCart">
                                    <select class='item-size-select'>
                                        <option value='1' selected>small</option>
                                        <option value='2'>medium</option>
                                        <option value='3'>large</option>`;
                    htmlString +=   `</select>
                                    <div class='item-input-group'>
                                        <div class='item-input-group-prepend'>
                                            <button class='btn btn-default menu-item-qty-minus'>-</button>
                                        </div>
                                        <input class='form-control menu-item-qty' type='number' min='0' value='1'>
                                        <div class='item-input-group-append'>
                                            <button class='btn btn-default menu-item-qty-plus'>+</button>
                                        </div>
                                    </div>
                                    <button type='submit' class='btn btn-success menu-item-add-btn'>ADD TO CART</button>
                                </div><!-- end of order section -->
                                
                            </div>
                        </div><!-- end of card -->`;
                    
                    $('#item-card-container').append(htmlString);
                });
                
            }
            
        });
    });
    
    $('#item-card-container').on('click', '.menu-item-order-btn', (ev) => {
        $('.menu-item-order-btn').show();
        $('.menu-item-desc').show();
        $('.menu-item-order-section').hide();
        $(ev.currentTarget).hide();
        $(ev.currentTarget).prev('.menu-item-desc').hide();
        $(ev.currentTarget).next('.menu-item-order-section').slideDown();
    });
    
    $('#item-card-container').on('click', '.menu-item-qty-minus', (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.item-input-group').find('.menu-item-qty');
        if(qtyInput.val() <= 0){return}
        let qty = Number(qtyInput.val()) - 1;
        qtyInput.val(qty);
    });
    
    $('#item-card-container').on('click', '.menu-item-qty-plus', (ev) => {
        ev.preventDefault();
        let qtyInput = $(ev.currentTarget).closest('.item-input-group').find('.menu-item-qty');
        let qty = Number(qtyInput.val()) + 1;
        qtyInput.val(qty);
    });
    
    $('#item-card-container').on('click', '.menu-item-add-btn', (ev) => {
        ev.preventDefault();
        $('.menu-item-order-btn').show();
        $('.menu-item-desc').show();
        $('.menu-item-order-section').hide();
        $(ev.currentTarget).siblings('.item-input-group').find('.menu-item-qty').val(1);
        $(ev.currentTarget).siblings('.item-size-select').val(1);
    });
    
    
});