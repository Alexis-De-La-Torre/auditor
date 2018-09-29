module.exports = (app, db, ensureLogin, sendEmail) => {
    app.get('/finalizar-auditoria/:id', ensureLogin, (req, res) => {
        if (req.user.permissions !== 'conta') {
            res.status(401)
            res.send(authMsg('Jefe de Contabilidad'))
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
                    audits.id =?
            `
    
            db.promise().query(query, [req.params.id])
            .then(x => x[0][0])
            .then(audit => {
                if (!audit) res.sendStatus(404)
                else res.render(
                    'finalizar-auditoria', 
                    { ...audit, user: req.user }
                )
            })
        }
    })
    
    app.post('/finalizar-auditoria/:id', (req, res) => {
        let subject
        let msg
    
        const id = req.params.id

        let values
        let query
    
        if (req.body.status === 'cerrado') {
            values = [req.body.status, req.params.id]
            query = 'update audits set status = ?, closing_date = now() where id = ?'
    
            subject = `Se cerro el reporte #${id}`
            msg = `
                Responsables: Jefe de Operaciones, Aux Contable y Jefe de Contabilidad<br>
                Se cerro el reporte #${id}<br>
                <a href="${process.env.HOST}/auditoria/${id}">Ver</a>
            `
        }
        else {
            values = [req.body.status, req.params.id]
            query = 'update audits set status = ? where id = ?'
    
            subject = `Es necesario que se atienda el reporte #${id}`
            msg = `
                Responsable: Gerencia<br>
                ${subject}<br>
                <a href="${process.env.HOST}/auditoria/${id}">Ver</a><br>
                <a href="${process.env.HOST}/resolver-auditoria/${id}">Resolver</a>
            `
        }
    
        db.promise().query(query, values)
            .then(async () => {
                await sendEmail(req.user.email, subject, msg)
                res.redirect('/administracion')
            })
    })
}