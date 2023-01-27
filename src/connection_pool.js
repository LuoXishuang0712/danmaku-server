const schedule = require('node-schedule')

class WsContainer {
    constructor(ws){
        this.ws = ws
        this.roomid = null
        this.userid = null
        this.username = null
        this.token = null
        this.last_active = new Date()
    }

    renew(){
        this.last_active = new Date()
    }
}

const connection_pool = []

schedule.scheduleJob("0 */3 * * * *", async () => {  // clean connection with on heart beat package in 2 minutes in 3 minutes
    let now = new Date()
    let last_renew = 0
    let cleaned = 0
    for(let index = 0; index < connection_pool.length; ){
        let item = connection_pool[index]
        if(now - item.last_active > 1000 * 60 * 2){  // 2 minutes
            item.ws.close()
            connection_pool.splice(index, 1)
            cleaned += 1
        }
        else{
            index += 1
        }
        last_renew += 1
        if(last_renew >= 15){  // refresh time cache
            now = new Date()
            last_renew = 0
        }
    }
    if(cleaned !== 0){
        console.log(`[${new Date().toISOString()}] [connection cleaner] clean ${cleaned} connections`)
    }
})

function indexOfConnectionPool(ws){
    let index = 0;
    for(index = 0; index < connection_pool.length; index++){
        if(connection_pool[index].ws === ws){
            return index
        }
    }
    return -1
}

function broadcast(roomid, msg, command="SERVER_BROADCAST"){
    let data_str = JSON.stringify(msg.getJSON())
    for(let i = 0; i < connection_pool.length; i ++){
        let item = connection_pool[i]
        if(item.roomid === roomid){
            try{
                item.ws.send(JSON.stringify({command, msg: "发送成功", data: data_str}))
            } catch (ignored) { }
        }
    }
}

exports.connection_pool = connection_pool
exports.indexOfConnectionPool = indexOfConnectionPool
exports.broadcast = broadcast
exports.WsContainer = WsContainer
// TODO refactor usage of connection_pool in ws.js to aviod direct usage
