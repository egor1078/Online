const http = require("http")

const queue = []
const rooms = {}

function send(res, data) {
    res.writeHead(200, {"Content-Type":"application/json","Access-Control-Allow-Origin":"*"})
    res.end(JSON.stringify(data))
}

function body(req, cb) {
    let d = ""
    req.on("data", c => d += c)
    req.on("end", () => { try { cb(JSON.parse(d)) } catch(e) { cb({}) } })
}

const server = http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
        res.writeHead(204, {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type"})
        return res.end()
    }

    if (req.method !== "POST") return send(res, {status:"error"})

    body(req, p => {
        if (req.url === "/search") {
            if (!p.id || !p.name) return send(res, {status:"error"})

            const idx = queue.findIndex(x => x.id === p.id)
            if (idx !== -1) queue.splice(idx, 1)

            const oppIdx = queue.findIndex(x => x.id !== p.id)
            if (oppIdx !== -1) {
                const opp = queue.splice(oppIdx, 1)[0]
                const roomId = p.id + "_" + opp.id
                rooms[roomId] = {
                    state:{px:0,py:0,p1x:0,p1y:0,p2x:0,p2y:0},
                    t:Date.now()
                }
                return send(res, {status:"found", opponent:opp, roomId:roomId, role:"guest"})
            }

            p.time = Date.now()
            queue.push(p)
            return send(res, {status:"waiting"})
        }

        if (req.url === "/cancel") {
            const i = queue.findIndex(x => x.id === p.id)
            if (i !== -1) queue.splice(i, 1)
            return send(res, {status:"ok"})
        }

        if (req.url === "/push") {
            if (!p.roomId || !rooms[p.roomId]) return send(res, {status:"error"})
            rooms[p.roomId].state = {px:p.px,py:p.py,p1x:p.p1x,p1y:p.p1y,p2x:p.p2x,p2y:p.p2y}
            rooms[p.roomId].t = Date.now()
            return send(res, {status:"ok"})
        }

        if (req.url === "/pull") {
            if (!p.roomId || !rooms[p.roomId]) return send(res, {status:"error"})
            return send(res, {status:"ok", state:rooms[p.roomId].state})
        }

        return send(res, {status:"error"})
    })
})

setInterval(() => {
    const now = Date.now()
    for (let i = queue.length-1; i >= 0; i--) {
        if (now - queue[i].time > 60000) queue.splice(i,1)
    }
    for (const id in rooms) {
        if (now - rooms[id].t > 30000) delete rooms[id]
    }
}, 10000)

server.listen(process.env.PORT || 8080, "0.0.0.0", () => console.log("ok"))
