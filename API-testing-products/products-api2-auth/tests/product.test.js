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
  describe("when the id is valid", () => {
    it("should return status 200", async () => {
      const product = await Product.findOne();

      await api
        .put(`/api/products/${product._id}`)
        .send({ description: "hihihahaha", stockQuantity: 1000 })
        .expect(200);
    });
    it("should persist the updated fields in the db", async () => {
        const product = await Product.findOne();
        const updates = {
            description: "hihihahaha",
            stockQuantity: 1000
        };

        await api.put(`/api/products/${product._id}`).send(updates).expect(200)
        const updated = await Product.findById(product._id)
        expect(updated.description).toBe(updates.description);
        expect(updated.stockQuantity).toBe(updates.stockQuantity)
    });
  });
  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
        await api.put("/api/products/12345555").send({}).expect(404);
    });
  })
});

describe("DELETE /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return status 204", async () => {
      const product = await Product.findOne();

      await api
        .delete(`/api/products/${product._id}`)
        .expect(204);
    });
    it("should remove the product from the db", async () => {
        const product = await Product.findOne();

        await api.delete(`/api/products/${product._id}`).expect(204)
        const deleted = await Product.findById(product._id)
        expect(deleted).toBeNull();
    });
  });
  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
        await api.delete("/api/products/12345555").expect(404);
    });
  })
});

describe("GET /api/products", () => {
    it("get all products", async () => {
        const res = await api.get("/api/products").expect(200);
        expect(res.body).toHaveLength(products.length);
    });

    it("return JSON + 200", async () => {
        await api
            .get("/api/products")
            .expect(200) //is it 200
            .expect("Content-Type",/application\/json/) //is it json
    });

    it("include a specific product in the returned list", async () => {
        const res = await api.get("/api/products");

        expect(res.body.map((Product) => Product.title)).toContain(
            "Wireless Mouse"
        );
    });

});



describe("POST /api/products", () => {
    describe("when the payload is valid", () => {
        it("return status 201", async () => {
            const newProduct =
            {
                title: "Computer",
                category: "Electronics",
                description: "Ergonomic wireless mouse with USB receiver.",
                price: 29.99,
                stockQuantity: 200,
                supplier: {
                    name: "TechSupply OY.",
                    contactEmail: "sale@techsupply.example",
                    contactPhone: "+358401233",
                    rating: 5,
                },
            };
            await api.post("/api/products").send(newProduct).expect(201);
        });

        it("persist the new product in the database", async () => {
            const newProduct = {
                title: "Computer",
                category: "Electronics",
                description: "Ergonomic wireless mouse with USB receiver.",
                price: 29.99,
                stockQuantity: 200,
                supplier: {
                    name: "TechSupply OY.",
                    contactEmail: "sale@techsupply.example",
                    contactPhone: "+358401233",
                    rating: 5,
                },
            };

            await api
                .post("/api/products")
                .send(newProduct)
                .expect(201);
            const productsPosted = await Product.find({});
            expect(productsPosted).toHaveLength(products.length + 1);
            expect(productsPosted.map((product) => product.title))
                .toContain(newProduct.title);
            });
        });
    });

    describe("the payload is invalid", () => {
        it("return status 400 when title is missing", async () => {
            const missingProduct = {
                category: "Electronics",
                description: "fake",
                price: 29.99,
                stockQuantity: 200,
                supplier: {
                    name: "nothing",
                    contactEmail: "sale@techsupply.example",
                    contactPhone: "+358401233",
                    rating: 5,
                },
            };

            await api
                .post("/api/products")
                .send(missingProduct)
                .expect(400);
        });

        it("should not increase the number of products in the database", async () => {
            const missingProduct = {
                category: "Electronics",
                description: "fake",
                price: 29.99,
                stockQuantity: 200,
                supplier: {
                    name: "nothing",
                    contactEmail: "sale@techsupply.example",
                    contactPhone: "+358401233",
                    rating: 5,
                },
            };

            await api
                .post("/api/products")
                .send(missingProduct)
                .expect(400);

            const finalHaul = await Product.find({});
            expect(finalHaul).toHaveLength(products.length);
    });
});


describe("GET /api/products/:productId", () => {
    describe("when the id is valid", () => {
        it("return product by id", async () => {
            const product = await Product.findOne();
            
            const res = await api
                .get(`/api/products/${product._id}`)
                .expect(200)
                .expect("Content-Type",/application\/json/);

            expect(res.body.title).toBe(product.title);

        })})
    
    describe("when id doesn't exist", () => {
        it("return status 404", async () => {
            const noId = new mongoose.Types.ObjectId();
            await api
                .get(`/api/products/${noId}`)
                .expect(404);
        })
    })

    describe("wrong id", () => {
        it("return status 404", async () => {
            await api 
                .get("/api/products/11111")
                .expect(404);
        });
    });
});
