const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const date = require(path.join(__dirname, "date.js"));
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;

// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true });
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
});

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// let items = ["Buy Food", "Cook Food", "Eat Food"];
// let workItems = [];
const itemsSchema = new mongoose.Schema({
    name: String,
});
const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!",
});
const item2 = new Item({
    name: "Hit the + button to add a new item",
});
const item3 = new Item({
    name: "<--Hit this to delete an item",
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
});
const List = mongoose.model("list", listSchema);

app.get("/", (req, res) => {
    let day = date();
    // res.render("list", { listTitle: day, newListItems: items });
    Item.find()
        .then((val) => {
            if (val.length === 0) {
                Item.insertMany(defaultItems)
                    .then((val) => {
                        console.log("Default items added to database successfully");
                    })
                    .catch((err) => {
                        console.error(err.message);
                    });
                res.redirect("/");
            } else res.render("list", { listTitle: day, newListItems: val });
        })
        .catch((err) => {
            console.error(err.message);
        });
});
app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName,
    });
    if (listName === date()) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then((foundList) => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch((err) => {
                console.error(err.message);
            });
    }
});
app.post("/delete", (req, res) => {
    // Item.deleteOne({ _id: req.body.checkbox })
    //     .then((val) => {
    //         console.log("Item deleted successfully");
    //         res.redirect("/");
    //     })
    //     .catch((err) => {
    //         console.error(err.message);
    //     });
    const checkboxId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === date()) {
        Item.findByIdAndDelete(checkboxId)
            .then((val) => {
                console.log("Item deleted successfully");
                res.redirect("/");
            })
            .catch((err) => {
                console.error(err.message);
            });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkboxId } } })
            .then((foundList) => {
                res.redirect("/" + listName);
            })
            .catch((err) => {
                console.error(err.message);
            });
    }
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName })
        .then((val) => {
            if (!val) {
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save();
                res.redirect("/" + customListName);
            } else res.render("list", { listTitle: val.name, newListItems: val.items });
        })
        .catch((err) => {
            console.error(err.message);
        });
});

app.get("/work", (req, res) => {
    res.render("list", { listTitle: "Work List", newListItems: workItems });
});

let port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at localhost:${port}`);
});
