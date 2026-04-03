const app = express()
app.use(express.json())

let queue = []
let rooms = {}

app.post("/search", (req, res) => {
    const p = req.body
    if (!p.id || !p.name) return res.json({status:"error"})
    queue = queue.filter(x => x.id !== p.id)
    const opp = queue.find(x => x.id !== p.id)
    if (opp) {
        queue = queue.filter(x => x.id !== opp.id)
        const roomId = p.id + "_" + opp.id
        rooms[roomId] = {
            host: opp.id,
            guest: p.id,
            state: {px:0,py:0, p1x:0,p1y:0, p2x:0,p2y:0},
            lastUpdate: Date.now()
        }
        return res.json({status:"found", opponent:opp, roomId:roomId, role:"guest"})
    }
    p.time = Date.now()
    queue.push(p)
    res.json({status:"waiting"})
})

app.post("/cancel", (req, res) => {
    queue = queue.filter(x => x.id !== req.body.id)
    res.json({status:"ok"})
})

app.post("/push", (req, res) => {
    const {roomId, px, py, p1x, p1y, p2x, p2y} = req.body
    if (!roomId || !rooms[roomId]) return res.json({status:"error"})
    rooms[roomId].state = {px,py,p1x,p1y,p2x,p2y}
    rooms[roomId].lastUpdate = Date.now()
    res.json({status:"ok"})
})

app.post("/pull", (req, res) => {
    const {roomId} = req.body
    if (!roomId || !rooms[roomId]) return res.json({status:"error"})
    res.json({status:"ok", state: rooms[roomId].state})
})

setInterval(() => {
    queue = queue.filter(x => Date.now() - x.time < 60000)
    for (const id in rooms) {
        if (Date.now() - rooms[id].lastUpdate > 30000) delete rooms[id]
    }
}, 10000)

app.listen(process.env.PORT || 8080, () => console.log("ok"))
