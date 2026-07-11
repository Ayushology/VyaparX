const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user.model");

require("./setup");

const createAuthenticatedUser = async () => {
  const unique = Date.now();

  const payload = {
    username: `addrdelete_${unique}`,
    email: `addrdelete_${unique}@example.com`,
    password: "Password123",
    fullName: {
      firstName: "Address",
      lastName: "Delete",
    },
  };

  await request(app).post("/auth/register").send(payload);

  const loginRes = await request(app)
    .post("/auth/login")
    .send({
      email: payload.email,
      password: payload.password,
    });

  return {
    payload,
    cookies: loginRes.headers["set-cookie"],
  };
};

describe("DELETE /auth/users/me/addresses/:addressId", () => {
  it("removes an existing address from the authenticated user profile", async () => {
    const { payload, cookies } = await createAuthenticatedUser();

    const user = await User.findOne({ email: payload.email });

    const addressId = new mongoose.Types.ObjectId();

    user.addresses.push({
      _id: addressId,
      street: "88 River View",
      city: "Bengaluru",
      state: "Karnataka",
      zip: "560001",
      country: "India",
      isDefault: false,
    });

    await user.save();

    const res = await request(app)
      .delete(`/auth/users/me/addresses/${addressId}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Address deleted successfully"
    );

    const updatedUser = await User.findOne({ email: payload.email });

    expect(updatedUser.addresses).toHaveLength(0);
  });

  it("returns 404 when the address does not exist", async () => {
    const { cookies } = await createAuthenticatedUser();

    const fakeAddressId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/auth/users/me/addresses/${fakeAddressId}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });

  it("returns 401 when no authentication token is provided", async () => {
    const addressId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/auth/users/me/addresses/${addressId}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("returns 401 for an invalid authentication token", async () => {
    const addressId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/auth/users/me/addresses/${addressId}`)
      .set("Cookie", ["token=invalid.jwt.token"]);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });
});