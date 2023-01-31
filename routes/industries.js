const express = require('express')
const router = express.Router();
const db  = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT i.code, i.industry, ci.comp_code 
             FROM industries AS i
             LEFT JOIN companies_industries AS ci
             ON i.code = ci.ind_code
        `)

        const industries = await db.query(`SELECT code, industry FROM industries`)
        for (let industry of industries.rows) {
            let codes = []
            for ( let row of results.rows ) {
                if (industry.code === row.code) {
                    codes.push(row.comp_code)
                }
            }
            industry.comp_codes = codes
        }
        return res.json({ industries: [industries.rows]})
    } catch(err) {
        return next(err)
    }
})

router.post('/', async(req, res, next) => {
    try {
        const { code, industry } = req.body
        const results = await db.query(`INSERT INTO industries (code, industry) VALUES($1, $2) RETURNING code, industry`, [code, industry])
        return res.status(201).json({ industry: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`
        SELECT i.code, i.industry, c.name AS companies
        FROM industries AS i
        LEFT JOIN companies_industries AS ci
        ON i.code = ci.ind_code 
        LEFT JOIN companies AS c
        ON ci.comp_code = c.code 
        WHERE i.code=$1`, [code])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can not find code ${code}`, 404)
        }
        const { industry } = results.rows[0]
        const companies = results.rows.map(r => r.companies)
        return res.json({ code, industry, companies })
    } catch(err) {
        return next(err)
    }
})

module.exports = router;