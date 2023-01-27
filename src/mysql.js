const mysql = require('mysql')
const db_config = {
    host: 'localhost',
    port: '3306',
    user: 'danmaku',
    password: 'Danmaku20120712',
    database: 'danmaku'
}

function close(conn){
    if(!conn){
        return;
    }
    conn.end((err) => {
        if(err){
            console.err(`MySQL连接关闭失败: ${err}`)
        }
        else{
            // do nothing
        }
    })
}

function db_query(sql) {
    let conn = mysql.createConnection(db_config)
    conn.connect(function (err) {
        if(err) {
            console.err(`MySQL连接失败: ${err}`)
        }
        else{
            // do nothing
        }
    })

    return new Promise((resolve, reject) => {
        conn.query(sql, (err, res) => {
            if(err){
                reject(err)
            }
            else{
                let result = JSON.parse(JSON.stringify(res))
                close(conn)
                resolve(result)
            }
        })
    })
}

exports.db_query = db_query