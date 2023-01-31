const express = require('express')
const router = express.Router();
const db  = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`)
        return res.json({ invoices: [results.rows]})
    } catch(err) {
        return next(err)
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can not find invoice #${id}`, 404)
        }
        const company_data = await db.query(`SELECT * FROM companies WHERE code=$1`, [results.rows[0].comp_code])
        const company = company_data.rows
        const { amt, paid, add_date, paid_date } = results.rows[0]
        return res.json({ invoice: { id, amt, paid, add_date, paid_date, company}})
    } catch(err) {
        return next(err)
    }
})

router.post('/', async(req, res, next) => {
    try {
        const { comp_code, amt } = req.body
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt])
        return res.status(201).json({ company: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.patch('/:id', async(req, res, next) => {
    try {
        const { id } = req.params
        const { amt, paid } = req.body
        const invoice = await db.query(`SELECT id, comp_code, paid, paid_date FROM invoices WHERE id=$1`, [id])
        if (invoice.rows.length === 0) {
            throw new ExpressError(`Can not find invoice with id ${id}`, 404)
        }
        let paid_status = invoice.rows[0].paid
        let paid_date = invoice.rows[0].paid_date;
        //if paying now, updating Paid date to todaay
        if (paid_status === false & paid === true) {
            paid_date = 'today';
        //if unpaying now, updating Paid_date to null
        } else if (paid_status === true & paid === false) {
            paid_date = null;
        }
        const results = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,[amt, paid, paid_date, id]);
        return res.json({ invoice: results.rows[0]})
    } catch(err) {
        return next(err)
    }
})

router.delete('/:id', async(req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id])
        if (invoice.rows.length === 0) {
            throw new ExpressError(`Could not find invoice #${id}`, 404)
        }
        const results = await db.query(`DELETE FROM invoices WHERE id=$1`, [id])
        return res.json({ status: "DELETED"})
    } catch(err) {
        return next(err)
    }
})

module.exports = router;