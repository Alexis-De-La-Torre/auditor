module.exports = (app, db, ensureLogin) => {
    app.get('/administracion', ensureLogin, (req, res) => {
        const query = `
            select 
                audits.*,
                date_format(reception_date, "%d/%m/%Y") as reception_date,
                branches.name as branch_name 
            from audits join branches 
                on branches.id = audits.branch_id
        `
    
        const isOp = req.user.permissions === 'op'
        const isConta = req.user.permissions === 'conta'
        const isContaAux = req.user.permissions === 'conta.aux'
        const isGeren = req.user.permissions === 'geren'
    
        db.promise().query(query)
        .then(x => {
            if (isGeren) {
                const branch_id = Number(req.user.branch_id)
                return x[0].filter(audit => audit.branch_id === branch_id)
            }
            else {
                return x[0]
            }
        })
        .then(audits => {
            const data = {
                audits: audits.map(audit => {
                    const isPendiente = audit.status === 'pendiente'
                    const isInvest = audit.status === 'investigacion'
                    const isRevic = audit.status === 'revision'
                    
                    const readyToFinalize = audit.status === 'información adicional'
                        || audit.status === 'por descontar'
                        || audit.status === 'depositado'
    
                    const isPendienteAndConta = isPendiente && isConta
                    const isRevicAndOp = isRevic && isOp
                    const isInvestAndGeren = isInvest && isGeren
                    const isReadyToFinAndConta = readyToFinalize && isConta
    
                    return {
                        ...audit,
                        isPendienteAndConta,
                        isRevicAndOp,
                        isInvestAndGeren,
                        isReadyToFinAndConta,
                    }
                }), 
                has_audits: audits.length > 0,
                user: req.user,
                isContaAux,
            }
            res.render('administracion', data)
        })
    })
}