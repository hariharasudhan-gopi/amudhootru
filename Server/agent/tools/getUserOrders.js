const orderService = require('../../services/orderService');

module.exports = {
    name: 'getUserOrders',
    description: "List the authenticated user's past orders, most recent first.",
    parameters: {
        type: 'object',
        properties: {
            limit: { type: 'number', description: 'Max number of orders to return, defaults to 5.' },
        },
    },
    async execute(args, ctx) {
        const limit = Number(args?.limit) > 0 ? Math.floor(Number(args.limit)) : 5;
        const orders = await orderService.getUserOrders(ctx.userId);

        return {
            orders: orders.slice(0, limit).map((order) => ({
                orderId: order.id,
                invoiceId: order.invoiceid,
                status: order.deliverystatus,
                paymentStatus: order.paymentstatus,
                dateOfOrder: order.dateoforder,
                products: (order.products || []).map((product) => ({
                    productCode: product.productcode,
                    name: product.productname,
                    quantity: product.quantity,
                })),
            })),
        };
    },
};
