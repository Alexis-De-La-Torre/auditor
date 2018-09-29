module.exports = (app, db, ensureLogin, sendEmail) => {
    app.get('/revisar-auditoria/:id', ensureLogin, (req, res) => {
        if (req.user.permissions !== 'op') {
            res.status(401)
            res.send(authMsg('Jefe de Operaciones'))
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
                    'revisar-auditoria', 
                    { ...audit, user: req.user }
                )
            })
        }
    })
    
    app.post('/revisar-auditoria/:id', ensureLogin, (req, res) => {
        const id = req.params.id
    
        const values = [ req.body.status, id ]
    
        const query = `
            update audits set
                status = ?
            where id = ?
        `
    
        const subject = `se ha pasado el reporte #${id} al estatus "${req.body.status}"`
        const msg = `
            Responsable: Jefe de Contabilidad<br>
            <br>
            ${subject}<br>
            <a href="http://localhost:3001/finalizar-auditoria/${id}">Finalizar</a>
        `
    
        db.promise().query(query, values)
        .then(async () => {
            await sendEmail(req.user.email, subject, msg)
            res.redirect('/administracion')
        })
    })
}