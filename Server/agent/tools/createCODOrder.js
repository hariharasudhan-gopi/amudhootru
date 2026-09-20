const cartService = require('../../services/cartService');
const orderService = require('../../services/orderService');

module.exports = {
    name: 'createCODOrder',
    description: 'Place a Cash on Delivery order for the current cart, using the account\'s first saved delivery address. This is IRREVERSIBLE and requires the user to have just explicitly confirmed in their previous message — the server enforces this regardless of the confirmed argument.',
    parameters: {
        type: 'object',
        properties: {
            confirmed: { type: 'boolean', description: 'Set to true only if the user just explicitly confirmed placing the order.' },
        },
        required: ['confirmed'],
    },
    // Read by toolExecutor.js to gate execution behind a server-verified user confirmation.
    requiresConfirmation: true,
    async execute(args, ctx) {
        const items = await cartService.getCart(ctx.userId);
        if (items.length === 0) {
            return { error: 'Cart is empty. Nothing to order.' };
        }

        const addresses = Array.isArray(ctx.deliveryAddress) ? ctx.deliveryAddress : [];
        if (addresses.length === 0) {
            return { error: 'No delivery address is saved on this account.' };
        }

        const outOfStock = items.filter((item) => Number(item.quantity) > Number(item.availablequantity));
        if (outOfStock.length > 0) {
            return {
                error: 'Some items in the cart exceed available stock.',
                outOfStock: outOfStock.map((item) => item.productcode),
            };
        }

        const products = items.map((item) => ({ productId: item.productcode, quantity: item.quantity }));

        const { orderId, invoiceNumber } = await orderService.placeCODOrder({
            userId: ctx.userId,
            usermail: ctx.usermail,
            isPrivilegeUser: ctx.isPrivilegeUser,
            products,
            deliveryAddress: addresses[0],
        });

        return {
            success: true,
            orderId,
            invoiceNumber,
            message: 'Order placed successfully with Cash on Delivery.',
        };
    },
};
