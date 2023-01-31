process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('c', 'TestCompany', 'some description')
      RETURNING code, name, description`);
  testCompany = result.rows;
});


/** GET /companies - returns `{companies: [..]}` */

describe("GET /companies", function() {
  test("Gets a list of 1 company", async function() {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({"companies": [testCompany] });
  });
});
// end


/** GET /company/[code] - return data about one company: `{company: company}` */

describe('GET /companies/:code', () => {
  test('Gets a single company', async () => {
    const code = testCompany[0].code;
    console.log(code)
    
    const results = await request(app).get(`/companies/${code}`);

    expect(results.statusCode).toBe(200);
    expect(results.body).toEqual({company: testCompany[0]});
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).get(`/companies/fvsv`);
    expect(response.statusCode).toEqual(404);
  });
});
// // end


// /** POST /company - create company from data; return `{company: company}` */

describe("POST /companies", function() {
  test("Creates a new company", async function() {
    const response = await request(app)
      .post(`/companies`)
      .send({
        name: "New Tech",
        description: "description is here"
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {code: "new-tech", name: "New Tech", description: "description is here"}
    });
  });
});
// // end


afterEach(async function() {
  // delete any data created by test
  await db.query("DELETE FROM companies");
});

afterAll(async function() {
  // close db connection
  await db.end();
});