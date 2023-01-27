const mysql = require('mysql')

const escape = mysql.escape

const { db_query } = require('./mysql')

const { get_token } = require('./token')

function reg_db(user_name, password){
    user_name = escape(user_name)
    password = escape(password)
    const sql = `
        insert into  \`user\` (\`user_name\`, \`password\`) values (${user_name}, ${password})
    `

    return new Promise((resolve, reject) => {
        db_query(sql).then((res) => {
            resolve(res)
        }).catch((err) => {
            reject(err)
        })
    })
}

function login_db(user_name, password){
    user_name = escape(user_name)
    const sql = `
        select user_id, password from \`user\` where \`user_name\`=${user_name}
    `

    return new Promise((resolve, reject) => {
        db_query(sql).then((res) => {
            if(!res || res.length === 0){
                reject("no such user")
            }
            if(res.length !== 1){
                reject("database internal error")
            }
            if(res[0].password !== password){
                reject("wrong password")
            }
            else{  // success
                get_token(res[0].user_id).then((res) => {
                    resolve(res)
                }).catch((err) => {
                    reject("database internal error")
                })
            }
        }).catch((err) => {
            reject(err)
        })
    })
}

const register = function (req, res) {
    if(!req.body.username || !req.body.password){
        res.send(JSON.stringify({status: false, msg: "缺少请求字段"}))
        return;
    }

    reg_db(req.body.username, req.body.password).then((result) => {
        if(result && result.affectedRows && result.affectedRows == 1){
            res.send(JSON.stringify({status: true, msg: "注册成功！"}))
        }
        else{
            console.log(message)
            res.send(JSON.stringify({status: false, msg: `注册失败：${result.message}`}))
        }
    }).catch((err) => {
        res.send(JSON.stringify({status: false, msg: `注册失败：${err}`}))
    })
}

const login = function (req, res) {
    if(!req.body.username || !req.body.password){
        res.send(JSON.stringify({status: false, msg: "缺少请求字段"}))
        return;
    }

    login_db(req.body.username, req.body.password).then((result) => {
        res.send(JSON.stringify({status: true, msg: "登录成功！", token: result}))
    }).catch((err) => {
        res.send(JSON.stringify({status: false, msg: `登录失败：${err}`}))
    })
}

exports.register = register
exports.login = login