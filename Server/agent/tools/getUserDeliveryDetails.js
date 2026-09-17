module.exports = {
    name: 'getUserDeliveryDetails',
    description: "Get the authenticated user's saved delivery address(es) from their account (from the current session, not the database directly).",
    parameters: { type: 'object', properties: {} },
    async execute(args, ctx) {
        const addresses = Array.isArray(ctx.deliveryAddress) ? ctx.deliveryAddress : [];
        if (addresses.length === 0) {
            return { hasAddress: false, message: 'No delivery address is saved on this account.' };
        }
        return { hasAddress: true, addresses };
    },
};
