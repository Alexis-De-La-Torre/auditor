module.exports = (app, db, ensureLogin, sendEmail) => {
    app.get('/analizar-auditoria/:id', ensureLogin, (req, res) => {
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
                    audits.id = ?
            `
            db.promise().query(query, [req.params.id])
            .then(x => x[0][0])
            .then(audit => {
                if (!audit) res.sendStatus(404)
                else res.render(
                    'analizar-auditoria', 
                    { ...audit, user: req.user }
                )
            })
        }
    })
    
    app.post('/analizar-auditoria/:id', ensureLogin, (req, res) => {
        if (req.body.status === 'cerrado') {
            const values = [
                req.body.problem_type,
                req.body.extra_info,
                req.body.closing_reason,
                req.body.closing_notes,
                req.body.status,
                req.params.id,
            ]
    
            const query = `
                update audits set
                    problem_type = ?,
                    extra_info = ?,
                    closing_reason = ?,
                    closing_date = now(),
                    closing_notes = ?,
                    status = ?
                where id = ?
            `
    
            const id = req.params.id
            const subject = `Se cerro el reporte #${id}`
            const msg = `
                Responsables: Jefe de Operaciones, Aux Contable y Jefe de Contabilidad<br>
                <br>
                Se cerro el reporte #${id}<br>
                <a href="http://localhost:3001/auditoria/${id}">Ver</a>
            `
    
            db.promise().query(query, values)
            .then(async () => {
                await sendEmail(req.user.email, subject, msg)
                res.redirect('/administracion')
            })
        }
        else {
            const values = [
                req.body.problem_type,
                req.body.extra_info,
                req.body.status,
                req.params.id
            ]
    
            const query = `
                update audits set
                    problem_type = ?,
                    extra_info = ?,
                    status = ?
                where id = ?
            `
    
            const id = req.params.id
            const subject = `Es necesario que atender el reporte #${req.params.id}`
            const msg = `
                Responsable: Gerencia<br>
                <br>
                ${subject}<br>
                <a href="http://localhost:3001/auditoria/${id}">Ver</a><br>
                <a href="http://localhost:3001/resolver-auditoria/${id}">Resolver (Gerencia)</a>
            `
    
            db.promise().query(query, values)
            .then(async () => {
                await sendEmail(req.user.email, subject, msg)
                res.redirect('/administracion')
            })
        }
    })
}