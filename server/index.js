const express = require('express');
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('data/db.json')
const authAdapter = new FileSync('data/auth.json')
const db = low(adapter)
const authDB = low(authAdapter)
let sheetDBMap = {};
let currentDB = null
db.defaults({
    auth: {},
    cells: {}
})
const app = express();
const bodyParser = require("body-parser")
var jsonParser = bodyParser.json()
app.use(express.static(path.join(__dirname, '../build')));

app.get('/ping', function (req, res) {
    return res.send('pong');
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});
app.post('/auth/', jsonParser, function (req, res) {
    let body = req.body;
    let soeid = body.soeid;
    delete body.soeid
    authDB.set(soeid, body).write()
})
app.get('/auth', function (req, res) {
    const soeid = req.query.soeid;
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(authDB.get(soeid).value()));
})
app.post('/data', jsonParser, (req, res) => {
    let body = req.body
    db.set(`data.${body.rowIndex}`, body.data).write()
})

app.get('/data/all', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(db.get(`data`).value()));
})

app.get('/data', (req, res) => {
    let sheetName = req.sheetName;
    let db = sheetDBMap[sheetName];
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(db.get(`data`).value()));
})

app.post('/data/addSheet', jsonParser, (req, res) => {
    let body = req.body;
    const adapter = new FileSync(`data/${body.name}.json`)
    const db = low(adapter)
    db.defaults({
        cells: {}
    })
    sheetDBMap[body.name] = db
})

// app.get('/data', (req, res) => {
//     const sheetName = req.query.sheetName;
//     const adapter = new FileSync(`data/${sheetName}.json`)
//     const db = low(adapter)
//     currentDB = db;
//     res.setHeader('Content-Type', 'application/json');
//     res.send(JSON.stringify(db.get(`data`).value()));
// })

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});



app.listen(process.env.PORT || 8080);