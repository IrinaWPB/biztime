process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeAll(async () => {
  let compResult = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('test', 'TestCompany', 'some description')
      RETURNING code, name, description`);
  testCompany = compResult.rows;
})

beforeEach(async function() {
  let invResult = await db.query(`
    INSERT INTO
      invoices (comp_code, amt, paid, paid_date) VALUES ('test', 30, false, null)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoice = invResult.rows;
});


/** GET /invoices - returns `{invoives: [..]}` */

describe("GET /invoices", function() {
  test("Gets a list of 1 invoice", async function() {
    const response = await request(app).get(`/invoices`);
    testInvoice[0].add_date = expect.any(String);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({invoices: [testInvoice]});
  });
});
// end


/** GET /invoices/[id] - return data about one invoice: `{invoice: invoice}` */

describe('GET /invoices/:id', () => {
  test('Gets a single invoice', async () => {
    const id = testInvoice[0].id;    
    const result = await request(app).get(`/invoices/${id}`);
    const { comp_code } = testInvoice[0];
    const company = await db.query(`SELECT * FROM companies WHERE code='${comp_code}'`);
    testInvoice[0].company = company.rows;
    testInvoice[0].add_date = expect.any(String)
    testInvoice[0].id = String(id)
    delete testInvoice[0].comp_code;
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({invoice: testInvoice[0] });
  });

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});
// // end


// /** POST /invoice - create company from data; return `{invoice: invoice}` */

describe("POST /invoices", function() {
  test("Creates a new invoice", async function() {
    const response = await request(app)
      .post(`/invoices`)
      .send({
        comp_code: "test",
        amt: 10
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      invoice: {id:expect.any(Number), comp_code: "test", amt: 10, paid: false, add_date: expect.anything(), paid_date: null}
    });
  });
});
// // end


// /** PATCH /invoices/[id] - update invoice; return `{invoice: invoice}` */

describe("PATCH /invoices/:id", function() {
  test("Updates a single invoice", async function() {
    const id = testInvoice[0].id
    const response = await request(app)
      .patch(`/invoices/${id}`)
      .send({
        amt: 10,
        paid: false
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {id: expect.any(Number), amt: 10, comp_code: "test", paid: false, add_date: expect.any(String), paid_date: null}
    });
  })
  

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).patch(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
    });


  test("Paid invoice adds paid_date", async () => {
    const id  = testInvoice[0].id
    const response = await request(app)
      .patch(`/invoices/${id}`)
      .send({
        amt: 20,
        paid: true
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {id: expect.any(Number), amt: 20, comp_code: "test", paid: true, add_date: expect.any(String), paid_date: expect.any(String)}
    })
  });
})
// end

describe('DELETE /invoices/:id', () => {
  test('Delete an invoice', async () => {
      const id = testInvoice[0].id;
      const results =  await request(app).delete(`/invoices/${id}`);
      expect(results.statusCode).toBe(200)
      expect(results.body).toEqual({ 
          status : "DELETED"
      })
  })
  test("Invoice doesn't exist", async () => {
      const results = await request(app).get('/invoices/0');
      expect(results.statusCode).toBe(404)
      expect(results.body).toEqual({ "error" : {
          "message": `Can not find invoice #0`, 
          "status": 404
      }})
  })
})

afterEach(async function() {
  // delete any data created by test
  await db.query("DELETE FROM invoices");
});

afterAll(async function() {
  await db.query("DELETE FROM companies");
  // close db connection
  await db.end();
});