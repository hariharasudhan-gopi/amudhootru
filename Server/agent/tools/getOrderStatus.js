const orderService = require('../../services/orderService');

module.exports = {
    name: 'getOrderStatus',
    description: "Get the status and details of a specific order (by order id or invoice id) belonging to the authenticated user, or their most recent order if no id is given. Always use this instead of guessing an order's status.",
    parameters: {
        type: 'object',
        properties: {
            orderId: { type: 'string', description: 'Order id or invoice id, e.g. "123" or "INV-2026-000123". Omit to get the latest order.' },
        },
    },
    async execute(args, ctx) {
        const orderId = args?.orderId ? String(args.orderId).trim() : '';
        // getOrderById/getLatestOrder are always scoped to ctx.userId — a user can never fetch another user's order.
        const order = orderId
            ? await orderService.getOrderById(ctx.userId, orderId)
            : await orderService.getLatestOrder(ctx.userId);

        if (!order) {
            return { error: orderId ? `No order found with id ${orderId}.` : 'You have no orders yet.' };
        }

        return {
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
        };
    },
};
