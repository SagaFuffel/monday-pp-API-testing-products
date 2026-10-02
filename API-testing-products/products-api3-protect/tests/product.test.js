const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Product = require("../models/productModel");
const User = require("../models/userModel");

const api = supertest(app);

const validUser = {
  name: "Jane Productowner",
  email: "jane.productowner@example.com",
  password: "Product123!",
  phone_number: "+358401234567",
  gender: "female",
  date_of_birth: "1995-06-15",
  membership_status: "active",
};

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

const newProduct = {
  ...products[0],
  title: "Phone",
  price: 999.99,
  stockQuantity: 200,
};

let token = null;

const authorizedRequest = (request) => {
  return request.set("Authorization", "Bearer " + token);
};

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await User.deleteMany({});

  const res = await api.post("/api/users/signup").send(validUser).expect(201);
  token = res.body.token;

  for (const product of products) {
    await authorizedRequest(api.post("/api/products"))
      .send(product)
      .expect(201);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /api/products", () => {
  it("should return all products", async () => {
    const res = await api.get("/api/products").expect(200);
    expect(res.body).toHaveLength(products.length);
  });

  it("should return products as JSON with status 200", async () => {
    await api
      .get("/api/products")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should include a specific product in the returned list", async () => {
    const res = await api.get("/api/products").expect(200);
    expect(res.body.map((product) => product.title)).toContain("Wireless Mouse");
  });
});

describe("GET /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return one product by ID", async () => {
      const product = await Product.findOne();

      const res = await api
        .get(`/api/products/${product._id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(res.body.title).toBe(product.title);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.get("/api/products/12345").expect(404);
    });
  });
});

describe("POST /api/products", () => {
  describe("when the user is authenticated", () => {
    it("should return status 201", async () => {
      await authorizedRequest(api.post("/api/products"))
        .send(newProduct)
        .expect(201);
    });

    it("should persist the new product with a user_id", async () => {
      await authorizedRequest(api.post("/api/products"))
        .send(newProduct)
        .expect(201);

      const productsAtEnd = await Product.find({});
      const savedProduct = await Product.findOne({ title: newProduct.title });
      const user = await User.findOne({ email: validUser.email });

      expect(productsAtEnd).toHaveLength(products.length + 1);
      expect(savedProduct).not.toBeNull();
      expect(savedProduct.user_id.toString()).toBe(user._id.toString());
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401", async () => {
      await api.post("/api/products").send(newProduct).expect(401);
    });

    it("should not increase the number of products in the database", async () => {
      await api.post("/api/products").send(newProduct).expect(401);

      const productsAtEnd = await Product.find({});
      expect(productsAtEnd).toHaveLength(products.length);
    });
  });
});

describe("PUT /api/products/:productId", () => {
  describe("when the user is authenticated", () => {
    it("should return status 200", async () => {
      const product = await Product.findOne();

      await authorizedRequest(api.put(`/api/products/${product._id}`))
        .send({ description: "Updated description" })
        .expect(200);
    });

    it("should persist the updated fields in the database", async () => {
      const product = await Product.findOne();
      const updates = { description: "Updated description", stockQuantity: 42 };

      await authorizedRequest(api.put(`/api/products/${product._id}`))
        .send(updates)
        .expect(200);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.description).toBe(updates.description);
      expect(updatedProduct.stockQuantity).toBe(updates.stockQuantity);
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401", async () => {
      const product = await Product.findOne();

      await api
        .put(`/api/products/${product._id}`)
        .send({ description: "Updated description" })
        .expect(401);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await authorizedRequest(api.put("/api/products/12345"))
        .send({ description: "Updated description" })
        .expect(404);
    });
  });
});

describe("DELETE /api/products/:productId", () => {
  describe("when the user is authenticated", () => {
    it("should return status 204", async () => {
      const product = await Product.findOne();
      await authorizedRequest(api.delete(`/api/products/${product._id}`))
        .expect(204);
    });

    it("should remove the product from the database", async () => {
      const product = await Product.findOne();

      await authorizedRequest(api.delete(`/api/products/${product._id}`))
        .expect(204);

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401", async () => {
      const product = await Product.findOne();
      await api.delete(`/api/products/${product._id}`).expect(401);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await authorizedRequest(api.delete("/api/products/12345")).expect(404);
    });
  });
});