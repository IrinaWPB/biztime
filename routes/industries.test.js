process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;
let testIndustry;

beforeEach(async function() {
  let compResult = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('comptestcode', 'TestCompany', 'some description')
      RETURNING code, name, description`);
  testCompany = compResult.rows;
  let indResult = await db.query(`
    INSERT INTO
      industries (code, industry) VALUES ('indtestcode', 'TestIndustry')
      RETURNING code, industry`);
  testIndustry = indResult.rows;
  let testRelationship = await db.query(`
    INSERT INTO companies_industries (ind_code, comp_code)
    VALUES ('indtestcode', 'comptestcode')
    RETURNING comp_code, ind_code`)
});


/** GET /idustries - returns `{industries: [..]}` */
describe("GET /industries", function() {
  test("Gets a list of 1 industry", async function() {
    const response = await request(app).get(`/industries`);
    testIndustry[0].comp_codes = [testCompany[0].code]
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({industries: [testIndustry]});
  });
});
// end


/** GET /invoices/[id] - return data about one invoice: `{invoice: invoice}` */

describe('GET /industries/:code', () => {
  test('Gets a single industry', async () => {
    const code = testIndustry[0].code;    
    const result = await request(app).get(`/industries/${code}`);
    testIndustry[0].companies = testCompany.map(r=>r.name)
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(testIndustry[0]);
  });

  test("Responds with 404 if can't find industry", async function() {
    const response = await request(app).get(`/industries/rbvas`);
    expect(response.statusCode).toEqual(404);
  });
});
// end


/** POST /industry - create industry from data; return `{industry: industry}` */

describe("POST /industries", function() {
  test("Add a new industry", async function() {
    const response = await request(app)
      .post(`/industries`)
      .send({
        code: "test2",
        industry: "TestIndustry2"
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      industry: {code: "test2", industry: "TestIndustry2"}
    });
  });
});
// end

afterEach(async function() {
  // delete any data created by test
  await db.query("DELETE FROM companies_industries")
  await db.query("DELETE FROM industries");
  await db.query("DELETE FROM companies");
  
});

afterAll(async function() {
  
  // close db connection
  await db.end();
});