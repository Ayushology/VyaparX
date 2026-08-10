    const { tool } = require("@langchain/core/tools");
    const { z } = require("zod");
    const axios = require("axios");

    const searchProduct = tool(
        async ({ query, token }) => {

            const response = await axios.get(
                `http://localhost:3001/api/products?q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return response.data;
        },
        {
            name: "searchProduct",
            description: "Search for products based on a query",
            schema: z.object({
                query: z
                    .string()
                    .describe("The search query for products")
            })
        }
    );

    const addProductToCart = tool(
        async ({ productId, quantity = 1, token }) => {

            const response = await axios.post(
                "http://localhost:3002/api/cart/items",
                {
                    productId,
                    quantity
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return response.data;
        },
        {
            name: "addProductToCart",
            description: "Add a product to the shopping cart",
            schema: z.object({
                productId: z
                    .string()
                    .describe("The id of the product to add to the cart"),

                quantity: z
                    .number()
                    .default(1)
                    .describe("The quantity of the product to add")
            })
        }
    );

    const getCart = tool(
        async ({ token }) => {
            const response = await axios.get("http://localhost:3002/api/cart", {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        {
            name: "getCart",
            description: "Fetch the user's current shopping cart items and details",
            schema: z.object({})
        }
    );

    const removeProductFromCart = tool(
        async ({ productId, token }) => {
            const response = await axios.delete(
                `http://localhost:3002/api/cart/items/${productId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            return response.data;
        },
        {
            name: "removeProductFromCart",
            description: "Remove a specific product from the user's shopping cart",
            schema: z.object({
                productId: z
                    .string()
                    .describe("The ID of the product to remove from the cart")
            })
        }
    );

    const getOrderStatus = tool(
        async ({ orderId, token }) => {
            const response = await axios.get(
                `http://localhost:3003/api/orders/${orderId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            return response.data;
        },
        {
            name: "getOrderStatus",
            description: "Get current status, tracking details, and timeline for an order",
            schema: z.object({
                orderId: z
                    .string()
                    .describe("The ID of the order to check")
            })
        }
    );

    module.exports = {
        searchProduct,
        addProductToCart,
        getCart,
        removeProductFromCart,
        getOrderStatus
    };