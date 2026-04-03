const express = require("express")
const app = express()
app.use(express.json())

let queue = []

app.post("/search", (req, res) => {
    const p = req.body
    if (!p.id || !p.name) return res.json({status:"error"})
    
    queue = queue.filter(x => x.id !== p.id)
    const opp = queue.find(x => x.id !== p.id)
    
    if (opp) {
        queue = queue.filter(x => x.id !== opp.id)
        return res.json({status:"found", opponent:opp})
    }
    
    p.time = Date.now()
    queue.push(p)
    res.json({status:"waiting"})
})

app.post("/cancel", (req, res) => {
    queue = queue.filter(x => x.id !== req.body.id)
    res.json({status:"ok"})
})

setInterval(() => {
    queue = queue.filter(x => Date.now() - x.time < 60000)
}, 10000)

app.listen(process.env.PORT || 8080, () => console.log("ok"))
