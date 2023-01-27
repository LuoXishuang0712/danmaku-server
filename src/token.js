const { escape } = require('mysql');
const { db_query } = require('./mysql')

var charStr = '';

function gene_str() {
    // a-z, A-Z, 0-9
    for(let i = 0; i < 62; i++){
        if(i < 26){
            charStr += String.fromCharCode(0x61 + (i - 0))
        }
        else if(i < 52){
            charStr += String.fromCharCode(0x41 + (i - 26))
        }
        else{
            charStr += String.fromCharCode(0x30 + (i - 52))
        }
    }
}

/**
 * 随机生成索引
 * @param min 最小值
 * @param max 最大值
 * @param i 当前获取位置
 */
function RandomIndex(min, max, i){
    let index = Math.floor(Math.random()*(max-min+1)+min),
        numStart = charStr.length - 10;
    //如果字符串第一位是数字，则递归重新获取
    if(i==0&&index>=numStart){
        index = RandomIndex(min, max, i);
    }
    //返回最终索引值
    return index;
}

/**
 * 随机生成字符串
 * @param len 指定生成字符串长度
 */
function getRandomString(len){
    if(charStr.length === 0){
        gene_str()
    }
    let min = 0, max = charStr.length-1, _str = '';
    //判断是否指定长度，否则默认长度为15
    len = len || 15;
    //循环生成字符串
    for(var i = 0, index; i < len; i++){
        index = RandomIndex(min, max, i);
        _str += charStr[index];
    }
    return _str;
}

function get_user_token(user_id, ret){
    sql = `
        select \`login_id\`, \`token\` from \`login\`
        where \`user_id\`=${user_id}
          and \`expiration\`>date_sub(now(), interval 14 day)
          order by \`expiration\` desc
    `

    return new Promise((resolve, reject) => {
        db_query(sql).then((res) => {
            if(!res || res.length === 0){
                resolve(null)
            }
            resolve(res[0].token)
        }).catch((err) => {
            reject(err)
        })
    })
}

function gene_token(){
    return getRandomString(128)
}

function reg_token(token, userid){
    token = escape(token)
    sql = `
        insert into \`login\` 
          (\`user_id\`, \`token\`)
        values
          (${userid}, ${token})
    `

    return new Promise((resolve, reject) => {
        db_query(sql).then((res) => {
            if(res && res.affectedRows && res.affectedRows === 0){
                reject("database internal error")
            }
            else{
                resolve(res)
            }
        }).catch((err) => {
            reject(err)
        })
    })
}

function renew_token(token){
    token = escape(token)
    sql = `
        update \`login\`
        set \`expiration\`=current_timestamp
        where \`token\`=${token}
    `

    return new Promise((resolve, reject) => {
        db_query(sql).then((res) => {
            if(res && res.affectedRows && res.affectedRows === 0){
                reject("database internal error")
            }
            else{
                resolve(res)
            }
        }).catch((err) => {
            reject(err)
        })
    })
}

function get_token(userid){
    return new Promise((resolve, reject) => {
        get_user_token(userid).then((res) => {
            if(res === null) {
                let new_token = gene_token()
                reg_token(new_token, userid).then((res) => {
                    resolve(new_token)
                }).catch((err) => {
                    reject(err)
                })
            }
            else{
                let this_token = res
                renew_token(this_token).then((res) => {
                    resolve(this_token)
                }).catch((err) => {
                    reject(err)
                })
            }
        }).catch((err) => {
            reject(err)
        })
    })
}

function get_user_by_token(token){
    token = escape(token)
    let sql = `
        select \`user\`.\`user_id\`, \`user\`.\`user_name\` from \`user\` 
          inner join \`login\` on \`user\`.\`user_id\` = \`login\`.\`user_id\` 
        where \`expiration\`>date_sub(now(), interval 14 day)
          and \`login\`.\`token\`=${token}
          order by \`expiration\` desc
        
    `

    return new Promise((resolve, reject) => {
        db_query(sql).then((res) => {
            resolve(res)
        }).catch((err) => {
            reject(err)
        })
    })
}

function verify_token(req, res) {
    if(!req.body.token){
        res.send(JSON.stringify({status: false, msg: "缺少请求字段"}))
        return;
    }

    get_user_by_token(req.body.token).then((result) => {
        if(!result || result.length === 0){
            res.send(JSON.stringify({status: false, msg: "登录已过期"}))
        }

        res.send(JSON.stringify({status: true, msg: "登录有效", data: result[0]}))

        renew_token(req.body.token)
    }).catch((err) => {
        res.send(JSON.stringify({status: false, msg: "服务器出错，请稍后再试"}))
    })
}

exports.get_token = get_token
exports.get_user_by_token = get_user_by_token
exports.verify_token = verify_token
