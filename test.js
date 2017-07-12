const request = require("supertest");
const assert = require("assert");
const crypto = require('crypto');
const application = require('./application.js');

describe("GET a login page", function () {
    it("Should return a successful status code", function (done) {
        request(application)
            .get("/login")
            .expect(200)
            .end(done);
    })
})

describe("GET a register page", function () {
    it("Should return a successful status code", function (done) {
        request(application)
            .get("/register")
            .expect(200)
            .end(done);
    })
})