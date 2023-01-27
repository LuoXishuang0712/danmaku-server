const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

require("./src/ws")

const parser = require('body-parser')
const multiparty = require('connect-multiparty')

const { register, login } = require('./src/user')
const { verify_token } = require('./src/token')
const { anchor } = require('./src/anchor')
const { live, live_status } = require('./src/message_pool')

app.use(parser.urlencoded({ extended: true }))
app.use(multiparty())
app.use(parser.json())

app.post('/register', register)
app.post('/login', login)
app.post('/verify', verify_token)
app.post('/anchor', anchor)
app.post('/live', live)
app.post('/status', live_status)

app.listen(8000, () => {
    console.log("Server started")
})
