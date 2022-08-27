const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.send('Senior Development Project Homepage!')
})

module.exports = router