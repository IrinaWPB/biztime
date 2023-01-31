const express = require('express')
const router = express.Router();
const db  = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`)
        return res.json({ companies: [results.rows]})
    } catch(err) {
        return next(err)
    }
})

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [code])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can not find code ${code}`, 404)
        }
        const invoices_data = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [code])
        results.rows[0].invoices = invoices_data.rows
        return res.json({ company: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.post('/', async(req, res, next) => {
    try {
        const { code, name, description } = req.body
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES($1, $2, $3) RETURNING code, name, description`, [code, name, description])
        return res.status(201).json({ company: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.patch('/:code', async(req, res, next) => {
    try {
        const { code } = req.params
        const { name, description } = req.body
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can not find company with code ${code}`, 404)
        }
        return res.json({ company: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.delete('/:code', async(req, res, next) => {
    try {
        const { code } = req.params;
        const company = await db.query(`SELECT * FROM companies WHERE code=$1`, [code])
        if (company.rows.length === 0) {
            throw new ExpressError(`Could not find company ${code}`, 404)
        }
        const results = await db.query(`DELETE FROM companies WHERE code=$1`, [code])
        return res.json({ status: "DELETED"})
    } catch(err) {
        return next(err)
    }
})



module.exports = router;