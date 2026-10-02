const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
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

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /api/users/signup", () => {
  describe("when the playload is valid", () => {
    it("should return status 201", async () => {
      await api
        .post("/api/users/signup")
        .send(validUser)
        .expect(201)
        .expect("Content-Type", /application\/json/);
    });
    it("should return the email and token", async () => {
      const res = await api
        .post("/api/users/signup")
        .send(validUser)
        .expect(201);

      expect(res.body).toHaveProperty("token");
      expect(res.body.email).toBe(validUser.email);
    });
    it("should persist the user in the database", async () => {
      await api.post("/api/users/signup").send(validUser).expect(201);
      const savedUser = await User.findOne({ email: validUser.email });
      expect(savedUser).not.toBeNull();
      expect(savedUser.name).toBe(validUser.name);
    });
  });
  describe("when the payload is invalid", () => {
    it("should return status 400 when required fields are missing", async () => {
      const res = await api
        .post("/api/users/signup")
        .send({ email: "hahahahaahha@gmail.com" })
        .expect(400);
      expect(res.body).toHaveProperty("error", "Please add all fields");
    });
    it("should not persist the user in the database", async () => {
      await api
        .post("/api/users/signup")
        .send({ email: "asdaw@example.com" })
        .expect(400);
      const currentUser = await User.find({});
      expect(currentUser).toHaveLength(0);
    });
  });
  describe("when the email is already registered", () => {
    it("should return status 400", async () => {
      await api.post("/api/users/signup").send(validUser).expect(201);
      const res = await api.post("/api/users/signup").send({ ...validUser, name: "hihihaha" }).expect(400);
      expect(res.body).toHaveProperty("error", "User already exists");
    });
  });
});

describe("POST /api/users/login", () => {
  beforeEach(async () => {
    await api.post("/api/users/signup").send(validUser).expect(201);
  });

  describe("when the credentials are valid", () => {
    it("should return status 200 with JSON", async () => {
      await api
        .post("/api/users/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200)
        .expect("Content-Type", /application\/json/);
    });

    it("should return the email and token", async () => {
      const res = await api
        .post("/api/users/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      expect(res.body.email).toBe(validUser.email);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.token.length).toBeGreaterThan(0);
    });
  });

  describe("when the credentials are invalid", () => {
    it("should return status 400 with a wrong password", async () => {
      const res = await api
        .post("/api/users/login")
        .send({
          email: validUser.email,
          password: "WrongPassword123!",
        })
        .expect(400);

      expect(res.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should return status 400 with an unregistered email", async () => {
      const res = await api
        .post("/api/users/login")
        .send({
          email: "unregistered@example.com",
          password: validUser.password,
        })
        .expect(400);

      expect(res.body).toHaveProperty("error", "Invalid credentials");
    });
  });
});
