module.exports = (app, db, ensureLogin) => {
    app.get('/auditoria/:id', ensureLogin, (req, res) => {
        const query = `
            select 
                audits.*,
                date_format(reception_date, "%d/%m/%Y") as reception_date,
                date_format(sale_date, "%d/%m/%Y") as sale_date,
                date_format(closing_date, "%d/%m/%Y") as closing_date,
                branches.name as branch_name 
            from audits join branches 
                on branches.id = audits.branch_id
            where 
                audits.id = ?
        `
        db.promise().query(query, [req.params.id])
        .then(x => x[0][0])
        .then(audit => res.render('auditoria', { user: req.user, ...audit }))
    })    
}