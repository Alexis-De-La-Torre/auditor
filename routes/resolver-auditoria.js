const Busboy = require('busboy')
const uuid = require('uuid/v4')
var path = require('path')
var fs = require('fs')

module.exports = (app, db, ensureLogin, sendEmail) => {
    app.get('/resolver-auditoria/:id', ensureLogin, (req, res) => {
        if (req.user.permissions !== 'geren') {
            res.status(401)
            res.send(authMsg('Gerente de Tienda'))
        }
        else {
            const query = `
                select 
                    audits.*,
                    date_format(reception_date, "%d/%m/%Y") as reception_date,
                    date_format(sale_date, "%d/%m/%Y") as sale_date,
                    branches.name as branch_name 
                from audits join branches 
                    on branches.id = audits.branch_id
                where 
                    audits.id = ?
            `
    
            db.promise().query(query, [req.params.id])
            .then(x => x[0][0])
            .then(audit => {
                if (!audit) res.sendStatus(404)
                else if (audit.branch_id !== req.user.branch_id) res.sendStatus(401)
                else res.render(
                    'resolver-auditoria', 
                    { ...audit, user: req.user }
                )
            })
        }
    })
    
    app.post('/resolver-auditoria/:id', ensureLogin, (req, res) => {
        var busboy = new Busboy({ headers: req.headers })
    
        let fileNames = {}
        busboy.on('file', function(fieldname, file, filename) {
            if (filename !== '') {
                fileNames[fieldname] = uuid() + '-' + filename
                var saveTo = path.join('./public/upload', fileNames[fieldname])
                file.pipe(fs.createWriteStream(saveTo))
            }
            else {
                file.resume()
            }
        })
    
        busboy.on('finish', () => {
            const id = req.params.id
    
            const promises = []
    
            if (fileNames.signed_discount_file) {
                const q = 'update audits set signed_discount_file = ? where id = ?'
                promises.push(db.promise().query(q, [fileNames.signed_discount_file, id]))
            }
    
            if (fileNames.deposit_voucher) {
                const q = 'update audits set deposit_voucher = ? where id = ?'
                promises.push(db.promise().query(q, [fileNames.deposit_voucher, id]))
            }
    
            if (fileNames.withdrawals_report) {
                const q = 'update audits set withdrawals_report = ? where id = ?'
                promises.push(db.promise().query(q, [fileNames.withdrawals_report, id]))
            }
    
            if (fileNames.staff_checks) {
                const q = 'update audits set staff_checks = ? where id = ?'
                promises.push(db.promise().query(q, [fileNames.staff_checks, id]))
            }
    
            const subject = `El reporte #${id} paso al estatus "revision"`
            const msg = `
                Responsable: Jefe de Operaciones<br>
                <br>
                ${subject}<br>
                <a href="http://localhost:3001/revisar-auditoria/${id}">Revisar</a>
            `
    
            Promise.all(promises)
            .then(async a => {
                const q = 'update audits set status = ? where id = ?'
                await db.promise().query(q, ['revision', id])
    
                await sendEmail(req.user.email, subject, msg)
    
                res.redirect('/administracion')
            })
            .catch(err => {
                res.send('hubo un error')
                console.log(err)
                console.log(query, values)
            })
        })
    
        return req.pipe(busboy)
    })
}