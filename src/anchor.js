const { escape } = require("mysql")
const {db_query} = require("./mysql")

function is_anchor(token){
    token = escape(token)
    sql = `
        select \`room_id\` from \`anchor\`
          inner join \`user\` on \`anchor\`.\`user_id\`=\`user\`.\`user_id\`
          inner join \`login\` on \`user\`.\`user_id\`=\`login\`.\`user_id\`
        where \`login\`.\`token\`=${token}
          and \`login\`.\`expiration\`>date_sub(now(), interval 14 day)
    `

    return db_query(sql)
}

function anchor(req, res){
    if(!req.body.token){
        res.send(JSON.stringify({status: false, msg: "缺少请求字段"}))
        return;
    }

    is_anchor(req.body.token).then((result) => {
        if(! result || result.length === 0){
            res.send(JSON.stringify({status: false, msg: "当前账号不是主播！"}))
            return
        }
        res.send(JSON.stringify({status: true, msg: "当前账号为主播！", room: result[0].room_id}))
    }).catch((err) => {
        res.send(JSON.stringify({status: false, msg: "服务器出错，请稍后再试"}))
    })
}

exports.anchor = anchor