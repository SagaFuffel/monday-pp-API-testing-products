const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Product = require("../models/productModel");

const api = supertest(app);

const products = [
  {
    title: "Wireless Mouse",
    category: "Electronics",
    description: "Ergonomic wireless mouse with USB receiver.",
    price: 29.99,
    stockQuantity: 150,
    supplier: {
      name: "TechSupply Co.",
      contactEmail: "sales@techsupply.example",
      contactPhone: "+358401112233",
      rating: 5,
    },
  },
  {
    title: "Standing Desk",
    category: "Furniture",
    description: "Adjustable height standing desk.",
    price: 499.95,
    stockQuantity: 30,
    supplier: {
      name: "OfficePro Ltd.",
      contactEmail: "orders@officepro.example",
      contactPhone: "+358409998877",
      rating: 4,
    },
  },
];

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Product.insertMany(products);
});

afterAll(async () => {
  await mongoose.connection.close();
});


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