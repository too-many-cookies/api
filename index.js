const express = require('express')
const api = require('./api')

const PORT = process.env.PORT || 3001

const app = express()

app.use('/api', api)

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`)
})