const WebSocket = require('ws')
const { get_live_status, Message, add_message, get_latest_message, check_roomid } = require('./message_pool')
const { get_user_by_token } = require('./token')
const { connection_pool, indexOfConnectionPool, broadcast, WsContainer } = require('./connection_pool')

const wss = new WebSocket.Server({address: '0.0.0.0', port: 8001})

wss.on('connection', (ws) => {
    connection_pool.push(new WsContainer(ws))
    setTimeout(() => {
        if(ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING){
            return
        }
        let index = indexOfConnectionPool(ws)
        if(index === -1 || !connection_pool[index].token){
            ws.close()
        }
    }, 10000)  // drop uninited connection in 10 secs 
    ws.on('message', (data, isBinary) => {
        data = isBinary ? data : data.toString()
        try{
            data = JSON.parse(data)
        } catch(err) {
            data = null  // be catched in the if block below
        }
        
        if(! data || !("command" in data)){
            // not a valid message
            return  // ignore
        }

        let index = indexOfConnectionPool(ws)
        if(index === -1){
            // not a recorded connection in pool
            try{
                ws.close()
            } catch (ignored) { }
            return;
        }

        switch(data.command){
            case "CLIENT_INIT_ROOMID": {
                if(!("roomid" in data) || !("token" in data)){
                    // not a valid init message
                    ws.send(JSON.stringify({command: "SERVER_INIT_ROOMID", status: false, msg: "缺少初始字段"}))
                    return
                }
                
                check_roomid(data.roomid, null).then((res) => {
                    if(! res || res.length === 0){
                        ws.send(JSON.stringify({command: "SERVER_INIT_ROOMID", status: false, msg: "未找到此房间号"}))
                        return
                    }

                    connection_pool[index].roomid = data.roomid
                    get_user_by_token(data.token).then((res) => {
                        if(!res || res.length === 0){
                            ws.send(JSON.stringify({command: "SERVER_INIT_ROOMID", status: false, msg: "登录失效，请刷新页面"}))
                            return
                        }

                        connection_pool[index].token = data.token
                        connection_pool[index].userid = res[0].user_id
                        connection_pool[index].username = res[0].user_name
                        ws.send(JSON.stringify({command: "SERVER_INIT_ROOMID", status: true, msg: "初始化成功"}))
                    }).catch((err) => {
                        ws.send(JSON.stringify({command: "SERVER_INIT_ROOMID", status: false, msg: "服务器出错了，请稍后再试"}))
                    })
                }).catch((err) => {
                    ws.send(JSON.stringify({command: "SERVER_INIT_ROOMID", status: false, msg: "服务器出错了，请稍后再试"}))
                })
                break
            }
            case "CLIENT_HEART_BEAT": {
                connection_pool[index].renew()
                break;
            }
            case "CLIENT_SEND_MESSAGE": {
                if(!("roomid" in data) || !("token" in data) || !("message" in data)){
                    // not a valid send message
                    ws.send(JSON.stringify({command: "SERVER_SEND_MESSAGE", status: false, msg: "缺少发送字段"}))
                    return
                }

                let live_status = get_live_status(data.roomid)
                if(!live_status.status){
                    ws.send(JSON.stringify({command: "SERVER_SEND_MESSAGE", status: false, msg: live_status.msg}))
                    return
                }

                if(connection_pool[index].roomid !== data.roomid){
                    ws.send(JSON.stringify({command: "SERVER_SEND_MESSAGE", status: false, msg: "请求字段注册错误，请重试"}))
                    return
                }

                get_user_by_token(data.token).then((res) => {
                    if(!res || res.length === 0){
                        ws.send(JSON.stringify({command: "SERVER_SEND_MESSAGE", status: false, msg: "登录失效，请刷新页面"}))
                        return
                    }

                    let message = new Message(res[0].user_id, res[0].user_name, data.message, null)

                    add_message(data.roomid, message)
                    ws.send(JSON.stringify({command: "SERVER_SEND_MESSAGE", status: true, msg: "发送成功", data: message.getJSON()}))

                    broadcast(data.roomid, message)
                }).catch((err) => {
                    ws.send(JSON.stringify({command: "SERVER_SEND_MESSAGE", status: false, msg: "服务器出错了，请稍后再试"}))
                })
                break
            }
            case "CLIENT_GET_HISTORY": {
                if(!("roomid" in data) || !("token" in data)){
                    // not a valid get message
                    ws.send(JSON.stringify({command: "SERVER_GET_HISTORY", status: false, msg: "缺少发送字段"}))
                    return
                }

                let live_status = get_live_status(data.roomid)
                if(!live_status.status){
                    ws.send(JSON.stringify({command: "SERVER_GET_HISTORY", status: false, msg: live_status.msg}))
                    return
                }

                // no token verify for speed

                ws.send(JSON.stringify({command: "SERVER_GET_HISTORY", status: true, msg: "查找成功", data: get_latest_message(data.roomid)}))
                break
            }
            default: {
                ws.send(JSON.stringify({command: "SERVER_NOT_A_VALID_COMMAND", status: false, msg: "不是一个有效的命令"}))
            }
        }
    })
    ws.on('close', () => {
        connection_pool.splice(indexOfConnectionPool(ws), 1)
    })
})
