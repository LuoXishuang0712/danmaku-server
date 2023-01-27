const { escape } = require("mysql")
const { db_query } = require("./mysql")
const { broadcast } = require("./connection_pool")

const message_queue = { }

function time_format(time) {
    return `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
}

class Message {
    constructor(userid, username, str, time) {
        this.str = str
        this.userid = userid
        this.username = username
        this.time = time || new Date()
    }

    getJSON(){
        return {
                userid: this.userid,
                username: this.username,
                time: time_format(this.time),
                msg: this.str
            }
    }
}

function live_start(room_id){
    if(!(room_id in message_queue)){
        message_queue[room_id] = []
        broadcast(room_id, new Message(-1, "SYSTEM", "主播已开播！", null))
    }
}

function live_end(room_id){
    if(room_id in message_queue){
        delete message_queue[room_id]
        broadcast(room_id, new Message(-1, "SYSTEM", "主播已下播！", null))
    }
}

function add_message(room_id, message){
    if(!(room_id in message_queue)){
        return {status: false, msg: "主播还未开播"}
    }
    let queue = message_queue[room_id]
    queue.push(message)
    while(queue.length >= 20){
        queue.splice(0, 1)
    }
    return {status: true, msg: "发送成功！"}
}

function get_latest_message(room_id){
    if(!(room_id in message_queue)){
        return {status: false, msg: "主播还未开播"}
    }
    let data = []
    for(let index in message_queue[room_id]){
        data.push(message_queue[room_id][index].getJSON())
    }
    return {status: true, msg: "获取成功！", data}
}

function get_live_status(room_id){
    if(!(room_id in message_queue)){
        return {status: false, msg: "主播还未开播"}
    }
    else{
        return {status: true, msg: "主播已开播！"}
    }
}

function check_roomid(room_id, token){
    room_id = escape(room_id)
    token = token && escape(token)
    sql = `
        select \`user\`.\`user_id\` from \`anchor\`
        inner join \`user\` on \`user\`.\`user_id\`=\`anchor\`.\`user_id\`
        inner join \`login\` on \`login\`.\`user_id\`=\`user\`.\`user_id\`
        where \`anchor\`.\`room_id\`=${room_id}
    ` + ((token === null) ? "" : 
    `
          and \`login\`.\`token\`=${token}
          and \`expiration\`>date_sub(now(), interval 14 day)
    `)

    return db_query(sql)
}

function live(req, res){
    if(!("command" in req.body) || !("roomid" in req.body) || !("token" in req.body)){
        res.send(JSON.stringify({status: false, msg: "缺少请求字段"}))
        return
    }

    check_roomid(req.body.roomid, req.body.token).then((result) => {
        if(!result || result.length === 0){
            res.send(JSON.stringify({status: false, msg: "房间号有误或系统问题，请尝试重新登录"}))
            return
        }
        
        switch(req.body.command){
            case "STREAM_START": {
                if(get_live_status(req.body.roomid).status){
                    res.send(JSON.stringify({status: false, msg: "状态错误"}))
                    break
                }
                live_start(req.body.roomid)
                res.send(JSON.stringify({status: true, msg: "操作完成"}))
                break
            }
            case "STREAM_STOP": {
                if(!get_live_status(req.body.roomid).status){
                    res.send(JSON.stringify({status: false, msg: "状态错误"}))
                    break
                }
                live_end(req.body.roomid)
                res.send(JSON.stringify({status: true, msg: "操作完成"}))
                break
            }
            default : {
                res.send(JSON.stringify({status: false, msg: "错误的操作命令"}))
            }
        }
    }).catch((err) => {
        res.send(JSON.stringify({status: false, msg: "服务器出错，请稍后再试"}))
    })
}

function live_status(req, res){
    if(!req.body.roomid){
        res.send(JSON.stringify({status: false, msg: "缺少请求字段"}))
        return
    }

    check_roomid(req.body.roomid, null).then((result) => {
        if(!result || result.length === 0){
            res.send(JSON.stringify({status: false, msg: "找不到此房间号"}))
            return
        }

        res.send(JSON.stringify({status: true, msg: "查找成功！", live: get_live_status(req.body.roomid)}))
    }).catch((err) => {
        res.send(JSON.stringify({status: false, msg: "服务器出错，请稍后再试"}))
    })
}

exports.Message = Message
exports.live_start = live_start
exports.live_end = live_end
exports.add_message = add_message
exports.get_latest_message = get_latest_message
exports.get_live_status = get_live_status
exports.live = live
exports.live_status = live_status
exports.check_roomid = check_roomid
