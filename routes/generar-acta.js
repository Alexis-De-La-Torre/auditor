module.exports = (app) => {
    app.get('/generar-acta', (req, res) => {
        const msg = `
            <html>
            <head>
                <style>p { margin-top: 100px }</style>
            </head>
            <body>
                <h1>Acta de descuento</h1>
                <strong>Responsable</strong> ${req.query.name} <br>
                <strong>Fecha de Venta</strong> ${req.query.saledate} <br>
                <strong>Diferencia</strong> $${req.query.diff} <br>
                <h1>Firmas:</h1><br>
                <p>${req.query.name}</p>
                <p>Gerencia</p>
                <p>Recursos Humanos</p>
                <p>Testigo</p>
            </body>
            </html>
        `
        res.send(msg)
    })
}