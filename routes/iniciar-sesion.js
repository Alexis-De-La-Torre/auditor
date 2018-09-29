module.exports = (app, passport, db) => {
    app.get('/iniciar-sesion', (req, res) => {
        const query = `
            select users.*, branches.name as branch_name from users 
            left join branches on branches.id = users.branch_id
        `
        db.promise().query(query)
        .then(x => x[0])
        .then(users => {
            const data = users.map(user => {
                let name
                if (!user.branch_name) name = user.job
                else name = `${user.job} - ${user.branch_name}`
    
                return { ...user, name }
            })
            res.render('iniciar-sesion', { users: data, default_email: users[0].email })
        })
    })
    
    app.post(
        '/iniciar-sesion',
        passport.authenticate('local', { failureRedirect: '/iniciar-sesion?failure=true' }),
        (req, res) => {
            res.redirect('/')
        }
    )
}