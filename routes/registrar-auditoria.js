const Busboy = require('busboy')
const uuid = require('uuid/v4')
const path = require('path')
const fs = require('fs')
const range = require('lodash.range')

module.exports = (app, db, ensureLogin, sendEmail, authMsg) => {
    app.get('/registrar-auditoria', ensureLogin, (req, res) => {
        if (req.user.permissions !== 'conta.aux') {
            res.status(401)
            res.send(authMsg('Aux de Contabilidad'))
        }
        else {
            db.promise().query('select * from branches')
            .then(x => x[0])
            .then(branches => res.render('registrar-auditoria', { branches, user: req.user }))
        }
    })
    
    app.post('/registrar-auditoria', (req, res) => {
        const id = req.params.id
    
        var busboy = new Busboy({ headers: req.headers })
    
        let fileName = ''
        busboy.on('file', function(fieldname, file, filename) {
            fileName = uuid() + '-' + filename 
            var saveTo = path.join('./public/upload', fileName)
            file.pipe(fs.createWriteStream(saveTo))
        })
    
        let body = {}
        busboy.on('field', (fieldname, val) => body[fieldname] = val)
    
        busboy.on('finish', () => {
            const values = [
                body.reception_date,
                body.sale_date,
                body.deposit_number,
                body.branch_id,
                body.currency,
                body.amount,
                body.diff,
                body.bank_account,
                body.notes,
                fileName,
                'pendiente',
            ]
    
            const query = `
                insert into audits (
                  reception_date,
                  sale_date,
                  deposit_number,
                  branch_id,
                  currency,
                  amount,
                  diff,
                  bank_account,
                  notes,
                  audit_file,
                  status  
                )
                values (${range(1, 12).map(() => '?')})
            `
    
            const subject = id => `Nuevo reporte de diferencias encontradas (#${id})`
            const msg = id => `
                Responsable: Jefe de Contabilidad<br>
                <br>
                existe un nuevo reporte de diferencias encontradas en el área de auditoría.<br>
                <a href="${process.env.HOST}/analizar-auditoria/${id}">Analizar</a>
            `
    
            db.promise().query(query, values)
            .then(x => x[0].insertId)
            .then(async id => {
                await sendEmail(req.user.email, subject(id), msg(id))
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