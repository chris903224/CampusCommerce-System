// ============================================
// HTML TEMPLATES - Separated from Logic
// ============================================

const Templates = {
    // ===== EMPTY STATES =====
    emptyOrders: () => `
        <div class="empty-state">
            <i class="fas fa-shopping-bag"></i>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here</p>
            <button class="btn-primary" data-page="shop" onclick="navigateTo('shop')">Start Shopping</button>
        </div>
    `,
    
    filterEmpty: (status) => `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>No ${status} orders</h3>
            <p>You don't have any orders with ${status} status</p>
            <button class="btn-primary" data-page="shop" onclick="navigateTo('shop')">Start Shopping</button>
        </div>
    `,
    
    // ===== ORDER ITEM ROW =====
    orderItemRow: (item, imageUrl) => {
        const imageHtml = (imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:')))
            ? `<img src="${imageUrl}" alt="${item.productName}">`
            : `<i class="${imageUrl || 'fas fa-box'}"></i>`;
        
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        
        return `
            <div class="order-item-row">
                <div class="order-item-image">${imageHtml}</div>
                <div class="order-item-details">
                    <div class="order-item-name">${escapeHtml(item.productName)}</div>
                    <div class="order-item-meta">
                        <span class="order-item-size">Size: ${item.size || 'Standard'}</span>
                        <span class="order-item-qty">Qty: ${item.quantity}</span>
                    </div>
                    <div class="order-item-price">₱${itemTotal.toFixed(2)}</div>
                </div>
            </div>
        `;
    },
    
    // ===== ORDER CARD =====
    orderCard: (order, statusInfo, deliveryInfo, itemsHtml, roomInfo, total, showCancel) => `
        <div class="order-card" data-status="${order.status}">
            <!-- HEADER -->
            <div class="order-card-header">
                <div class="order-id">Order #${order.orderNumber || order.id}</div>
                <div class="order-date">📅 ${order.orderDateFormatted}</div>
                <div class="order-status-badge ${statusInfo.class}">
                    ${statusInfo.icon} ${statusInfo.text}
                </div>
            </div>
            
            <!-- BODY -->
            <div class="order-card-body">
                <!-- LEFT: ORDER ITEMS -->
                <div class="order-items-section">
                    <div class="order-items-title">
                        <i class="fas fa-boxes"></i> Items
                    </div>
                    <div class="order-items-list">
                        ${itemsHtml}
                    </div>
                </div>
                
                <!-- RIGHT: ORDER INFO -->
                <div class="order-info-section">
                    <!-- Payment & Room Info -->
                    <div class="order-info-card">
                        <div class="order-info-title">
                            <i class="fas fa-credit-card"></i> Payment Details
                        </div>
                        <div class="order-info-row">
                            <span class="order-info-label">Payment Method:</span>
                            <span class="order-info-value">${order.paymentMethod || 'Standard'}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="order-info-label">Room / Building:</span>
                            <span class="order-info-value">${roomInfo}</span>
                        </div>
                        ${order.specialDelivery ? `
                        <div class="order-info-row">
                            <span class="order-info-label">Special Instructions:</span>
                            <span class="order-info-value">${escapeHtml(order.specialDelivery.substring(0, 50))}</span>
                        </div>
                        ` : ''}
                        <div class="order-info-row total-row">
                            <span class="order-info-label">Total Amount:</span>
                            <span class="order-info-value order-total-amount">₱${total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <!-- TRACKING & DELIVERY -->
                    ${deliveryInfo.show ? `
                    <div class="tracking-section">
                        <div class="order-info-title">
                            <i class="fas fa-truck"></i> Delivery Tracking
                        </div>
                        <div class="order-info-row">
                            <span class="order-info-label">Tracking Number:</span>
                            <span class="order-info-value tracking-number">${deliveryInfo.trackingNumber}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="order-info-label">Est. Delivery:</span>
                            <span class="order-info-value">${deliveryInfo.estimatedDelivery}</span>
                        </div>
                        <div class="order-info-row">
                            <span class="order-info-label">Delivery Status:</span>
                            <span class="delivery-status ${deliveryInfo.statusClass}">
                                ${deliveryInfo.statusIcon} ${deliveryInfo.statusText}
                            </span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- FOOTER - ACTIONS -->
            ${showCancel ? `
            <div class="order-card-footer">
                <button class="btn-cancel-order" onclick="cancelOrder(${order.id})">
                    <i class="fas fa-times-circle"></i> Cancel Order
                </button>
            </div>
            ` : ''}
        </div>
    `,
    
    // ===== STATIC QR MODAL =====
    staticQRModal: (total) => `
        <div style="background: var(--bg-primary, white); padding: 30px; border-radius: 20px; max-width: 450px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: flex-end;">
                <button onclick="closePayMongoModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-primary, #333);">&times;</button>
            </div>
            <h2 style="margin-bottom: 20px;"><i class="fas fa-qrcode"></i> Scan to Pay</h2>
            <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block;">
                <img src="qrcode.png" alt="GCash QR Code" style="width: 220px; height: 220px; object-fit: contain; border: 2px solid #00aa4e; border-radius: 12px;">
            </div>
            <div style="margin: 20px 0;">
                <p style="font-size: 18px; font-weight: bold; color: #2ecc71;">Amount: ₱${total.toFixed(2)}</p>
                <p><i class="fas fa-mobile-alt"></i> Scan with GCash app</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    <i class="fas fa-info-circle"></i> GCash Number: <strong>09152797837</strong>
                </p>
            </div>
            <button class="btn-primary" onclick="confirmStaticPayment()" style="padding: 10px 30px; margin-top: 10px;">
                <i class="fas fa-check-circle"></i> I Have Paid
            </button>
            <button class="btn-secondary" onclick="closePayMongoModal()" style="padding: 10px 30px; margin-top: 10px;">Cancel</button>
        </div>
    `,
    
    // ===== PAYMENT WINDOW DETAILS =====
    paymentDetails: {
        gcashManual: (total) => `
            <div class="payment-instruction">
                <h4>📱 Manual GCash Payment</h4>
                <p>Please send payment to:</p>
                <div class="gcash-details-card">
                    <p><strong>GCash Number:</strong> <span class="gcash-number">09152797837</span></p>
                    <p><strong>Name:</strong> Christian Villanueva</p>
                    <p><strong>Amount:</strong> <span class="amount">₱${total.toFixed(2)}</span></p>
                </div>
                <div class="payment-steps">
                    <p><strong>How to pay:</strong></p>
                    <ol>
                        <li>Open GCash app</li>
                        <li>Tap "Send Money" or "Pay QR"</li>
                        <li>Enter GCash number: <strong>09152797837</strong></li>
                        <li>Enter amount: <strong>₱${total.toFixed(2)}</strong></li>
                        <li>Complete the payment</li>
                        <li>Click "Confirm Order" below after payment</li>
                    </ol>
                </div>
            </div>
        `,
        
        gcashQR: (total) => `
            <div class="payment-instruction" id="paymentQRInstruction">
                <h4><i class="fas fa-qrcode"></i> Scan QR Code to Pay</h4>
                <div class="paymongo-info" style="background: #1c1818; padding: 15px; border-radius: 10px; margin: 15px 0;">
                    <p><strong>Amount:</strong> <span class="amount" id="staticQRAmount">₱${total.toFixed(2)}</span></p>
                    <p><strong>Merchant:</strong> SJC Supply</p>
                    <p><strong>GCash Number:</strong> 09152797837</p>
                    <p><i class="fas fa-shield-alt"></i> Scan the QR code below to pay</p>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                    <img id="staticQRCodeImage" src="qrcode.png" 
                         alt="GCash QR Code" 
                         style="width: 220px; height: 220px; object-fit: contain; border: 2px solid #00aa4e; border-radius: 16px; background: white; padding: 10px;">
                    <p style="margin-top: 10px; font-size: 12px; color: #666;">
                        <i class="fas fa-mobile-alt"></i> Scan with GCash app
                    </p>
                </div>
                <div class="payment-steps">
                    <p><strong>How to pay:</strong></p>
                    <ol>
                        <li>Open GCash app</li>
                        <li>Tap "Scan QR" or "Pay QR"</li>
                        <li>Scan the QR code above</li>
                        <li>Enter amount: <strong>₱${total.toFixed(2)}</strong></li>
                        <li>Complete the payment</li>
                        <li>Click "I Have Paid" button below after payment</li>
                    </ol>
                </div>
                <button class="btn-primary" id="staticQRConfirmBtn" style="width: 100%; margin-top: 15px;">
                    <i class="fas fa-check-circle"></i> I Have Paid
                </button>
            </div>
        `,
        
        cashOnDelivery: (total) => `
            <div class="payment-instruction">
                <h4>🚚 Cash on Delivery</h4>
                <p>You have selected Cash on Delivery.</p>
                <div class="cod-details">
                    <p><strong>Total Amount:</strong> ₱${total.toFixed(2)}</p>
                    <p>Please prepare exact amount when the driver arrives.</p>
                </div>
            </div>
        `
    },
    
    // ===== PRODUCT CARD =====
    productCard: (product) => {
        const minPrice = product.sizes?.length ? Math.min(...product.sizes.map(s => s.price)) : 0;
        const imageHtml = product.imageUrl 
            ? `<img src="${product.imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23cccccc\'/%3E%3Ctext x=\'20\' y=\'120\' fill=\'white\' font-size=\'18\'%3ENo%3C/text%3E%3Ctext x=\'20\' y=\'150\' fill=\'white\' font-size=\'18\'%3EImage%3C/text%3E%3C/svg%3E'">`
            : `<i class="${product.icon || 'fas fa-box'}"></i>`;
        
        return `
            <div class="product-card" onclick="openProductModal(${product.id})">
                <div class="product-image-wrapper">
                    <div class="product-badge">New</div>
                    ${imageHtml}
                    <button class="quick-view" onclick="event.stopPropagation(); openProductModal(${product.id})">Quick View</button>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category || 'Uncategorized'}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">₱${minPrice}</div>
                </div>
            </div>
        `;
    },
    
    // ===== SIZE OPTION =====
    sizeOption: (size, index, isDisabled) => `
        <div class="size-option ${index === 0 && !isDisabled ? 'active' : ''} ${isDisabled ? 'disabled' : ''}" 
             data-size="${size.name}" data-price="${size.price}" data-stock="${size.stock || 0}"
             onclick="${!isDisabled ? `selectSize('${size.name}', ${size.price})` : ''}">
            <div class="size-name">${size.name}</div>
            <div class="size-desc">${size.desc || ''}</div>
            <div class="size-price">₱${size.price}</div>
            <div class="size-stock">${size.stock > 0 ? `${size.stock} left` : 'Out of stock'}</div>
        </div>
    `,
    
    // ===== CART ITEM =====
    cartItem: (item, imageUrl) => {
        const imageHtml = imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:'))
            ? `<img src="${imageUrl}" alt="${item.productName}" class="cart-item-image">`
            : `<i class="${imageUrl || 'fas fa-box'}"></i>`;
        
        return `
            <div class="cart-item">
                <div class="cart-item-image-wrapper">${imageHtml}</div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="cart-item-size">Size: ${item.size}</div>
                    <div class="cart-item-price">₱${(item.total || (item.price * item.quantity)).toFixed(2)}</div>
                    <div class="cart-item-qty">Qty: ${item.quantity}</div>
                </div>
                <button class="remove-cart-item" onclick="removeFromCart(${item.id})"><i class="fas fa-times"></i></button>
            </div>
        `;
    }
};