const express = require("express");
const cors = require("cors");
const { userconnect, hotelconnect, bookingsconnect } = require("./dbconnect");
const path = require("path");
const MongoId = require("mongodb").ObjectId;
const fs = require("fs");
const multer = require('multer');
const upload = multer({ dest: './uploads/link' });
const download = require('image-downloader');
const PORT = process.env.PORT || 5000 ; 

let collect;
let collecthotel;

(async function connect() {
    collect = await userconnect();
    collecthotel = await hotelconnect();
})();


const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads/link", express.static(__dirname + "/uploads/link"))



app.post("/login", async (req, resp) => {

    let r = await collect.findOne({ mail: req.body.mail });
    let output = {};
    if (!r) {
        output.ok = false;
        output.err = "Email doesn't exists";
        resp.json(output);
    }
    else if (req.body.pass !== r.pass) {
        output.ok = false;
        output.err = "Incorrect Password";
        resp.json(output);
    }
    else {
        r._id = r._id.toString();
        output = {
            ...r,
            ok: true,
            err: null
        };
        resp.json(output);
    }
})

app.get("/", (req,resp)=>{
    resp.json({
        ok : "all good"
    });
})

app.post("/signup", async (req, resp) => {

    let r = await collect.find({ mail: req.body.mail }).toArray();
    let output = {};
    if (r.length) {
        output.ok = false;
        output.id = null;
        resp.json(output);
    }
    else {
        r = await collect.insertOne(req.body);
        output.ok = "ok";
        output.id = r.insertedId.toString();
        resp.json(output);
    }
})

app.put("/update/:id", async (req, resp) => {
    let userid = new MongoId(req.params.id);
    let r = await collect.updateOne({ _id: userid }, { $set: req.body });
    let output = {};
    if (r.acknowledged) {
        output.ok = true;
        resp.json(output);
    }
    else {
        output.ok = false;
        resp.json(output);
    }
})

app.put("/updatepass/:id", async (req, resp) => {
    let userid = new MongoId(req.params.id);
    let one = await collect.findOne({ _id: userid });
    output = {};
    if (req.body.oldpass !== one.pass) {
        output.ok = false;
        resp.json(output);
    }
    else {
        let r = await collect.updateOne({ _id: userid }, { $set: { pass: req.body.newpass } });
        output.ok = true;
        resp.json(output);
    }
})

app.post("/uploadfiles", upload.array('mypics', 100), (req, resp) => {
    let uploadedfiles = [];
    let correctpath = "";

    for (let i = 0; i < req.files.length; i++) {
        console.log("oi cunt ",i," is ", req.files[i]);
        correctpath = path.join(req.files[i].destination, `${req.files[i].filename}${path.extname(req.files[i].originalname)}`);
        fs.renameSync(req.files[i].path, correctpath);
        uploadedfiles.push(correctpath);
        console.log("correct path for ",i," is ",correctpath);
    }
    resp.json({
        ok: true,
        uploadedfiles: uploadedfiles
    });
    console.log("all done now " , uploadedfiles);
});

app.post("/uploadbylink", (req, resp) => {

    console.log("link active");
    let newname = "/uploads/link/" + Date.now() + ".jpg";
    download.image({
        url: req.body.url,
        dest: __dirname + newname
    }).then(({ filename }) => {

        resp.json({ ok: true, location: newname })

    }).catch((err) => resp.json({ ok: false, location: null }));
})


app.post("/addhotel", async (req, resp) => {
    let r = await collecthotel.insertOne(req.body);
    let output = {};
    if (r.acknowledged) {
        output.ok = true;
        output.id = r.insertedId.toString()
        resp.json(output);
    }
    else {
        output.ok = false;
        output.id = none
        resp.json(output);
    }
})

app.get("/hotellist", async (req, resp) => {
    collecthotel = await hotelconnect();
    let r = await collecthotel.find().toArray();
    resp.json(r);
})

app.get("/userbookings/:id", async (req, resp) => {

    collecthotel = await hotelconnect();
    let r = await collecthotel.find({ owner: req.params.id }).toArray();
    resp.json(r);
})

app.post("/deletepics", async (req, resp) => {
    console.log(req.data.pics);
})

app.get('/gethotel/:id', async (req, resp) => {
    let r = await collecthotel.findOne({ _id: new MongoId(req.params.id) });
    resp.json(r);
})

app.get('/getowner/:id', async (req, resp) => {
    let r = await collect.findOne({ _id: new MongoId(req.params.id) });
    resp.json(r);
})



app.put('/addbooking/:userid', async (req, resp) => {
    const connectbook = await bookingsconnect();
    let output = {};
    let flag = true;
    let today = new Date();
    let todelete = [];

    let userbookings = await connectbook.findOne({ owner: req.params.userid });
    if (!userbookings) {
        let r = await connectbook.insertOne({ owner: req.params.userid, bookings: [req.body] });
        output.ok = true;
        resp.json(output);
        flag = false;
    }
    else {
        for (let i = 0; i < userbookings.bookings.length; i++) {
            if (userbookings.bookings[i].hotelid === req.body.hotelid) {
                output.ok = false;
                output.err = "Booking already exists";
                resp.json(output);
                flag = false
            }
            if (today > new Date(userbookings.bookings[i].checkout)) {
                todelete.push(i);
                console.log(userbookings.bookings[i].checkout);
            }
        }
    }

    if (flag) {
        let r = await connectbook.updateOne({ _id: userbookings._id }, { $push: { bookings: req.body } });
        output.ok = true;
        resp.json(output);
    }

    for (let y of todelete) {
        await connectbook.updateOne({ _id: userbookings._id }, { $pull: { bookings: userbookings.bookings[y] } });
    }
})

app.get('/getbooking/:userid', async (req, resp) => {
    const connectbook = await bookingsconnect();
    let output = {};
    
    let r = await connectbook.findOne({ owner: req.params.userid });
    if (r) {
        output.ok = true;
        output.bookings = r.bookings;
        resp.json(output);
    }
    else{
        output.ok = false;
        resp.json(output);
    }
})



app.listen(PORT , ()=>{console.log("server started on port " , PORT)});