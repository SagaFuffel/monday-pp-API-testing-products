const { application } = require("express")
const mongoose = require("mongoose")
const { describe, expect } = require("vitest")

describe("PUT /api/products/:productId", () => {
    describe("while id is correct", () => {
        it("return (200)", async () => {
            const prod = await Prod.findOne();

            await api   //_id
                .put(`/api/products/${prod._id}`)
                .send({ description: "New version", stockQuantity: 42 })
                .expect(200)
        });
        it("stay", async () => {
            const prod = await Prod.findOne();
            const update = {
                stockQuantity: 42,
                description: "New amount"
            };

            await api.put(`/api/products/${prod._id}`).send(update).expect(200);

            const updatedProd = await Prod.findById(prod._id);
            expect(updatedProd.stockQuantity).toBe(update.stockQuantity);
            expect(updatedProd.description).toBe(update.description);
        });
    });

//wrong
    describe("id incorrect", () => {
        it("return (400)", async () => {
            await api.put(`/api/products/${prod._id}`).send({}).expect(400);
        });
    });
});

//delete
describe("DELETE /api/products/:productId", () => {
    describe("while id is correct", () => {
        it("return (200(?))", async () => {
            const prod = await Prod.findOne();
            await api.delete(`/api/products/${prod._id}`).expect(200);
        });
        it("remove a product", async () => {
            const prod = await Prod.findOne();
            await api.delete(`/api/products/${prod._id}`).expect(200);

            const deleteProd = await Prod.findById(prod._id);
            expect(deleteProd).toBeNull();
        });

    });


//wrong
    describe("id incorrect", () => {
        it("return (400)", async () => {
            await api.put(`/api/products/${prod._id}`).send({}).expect(400);
        });
    });
});