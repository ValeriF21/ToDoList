/* Requires */
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
/* === === === === */

/* Definitions */
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

console.log("mongodb+srv://"+ process.env.DB_ADMIN +":"+ process.env.DB_PASS +"@cluster0.d0cvh.mongodb.net/"+ process.env.DB_DATABASE +"?retryWrites=true&w=majority");

mongoose.connect("mongodb+srv://"+ process.env.DB_ADMIN +":"+ process.env.DB_PASS +"@cluster0.d0cvh.mongodb.net/"+ process.env.DB_DATABASE +"?retryWrites=true&w=majority", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
/* === === === === */

/* Schema's */
const itemsSchema = { name: String };
const Item = mongoose.model("Item", itemsSchema);

const listsSchema = { name: String, items: [itemsSchema] };
const List = mongoose.model("List", listsSchema);
/* === === === === */

/* Global Variables */
let today = new Date();
let options = {
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric",
};
/* === === === === */

/* GET requests */
app.get("/", (req, res) => {
	Item.find({}, (err, results) => {
		console.log(results);
		res.render("list", {
			listTitle: today.toLocaleDateString("en-US", options),
			newListItems: results,
		});
	});
});

app.get("/:customListName", (req, res) => {
	const customName = _.capitalize(req.params.customListName);
	List.findOne({ name: customName }, (err, result) => {
		if (!err) {
			if (!result) {
				const list = new List({
					name: customName,
					items: Array(),
				});
				list.save();
				res.redirect("/" + customName);
			} else {
				res.render("list", {
					listTitle: result.name,
					newListItems: result.items,
				});
			}
		}
	});
});
/* === === === === */

/* POST requests */
app.post("/", (req, res) => {
	const newItem = new Item({ name: req.body.item });
	const listName = req.body.button;
	if (listName === today.toLocaleDateString("en-US", options)) {
		newItem.save();
		res.redirect("/");
	} else {
		List.findOne({ name: listName }, (err, foundList) => {
			foundList.items.push(newItem);
			foundList.save();
			res.redirect("/" + listName);
		});
	}
});

app.post("/delete", (req, res) => {
	const listName = req.body.listName;
	const itemId = req.body.checkbox;

	if (listName === today.toLocaleDateString("en-US", options)) {
		Item.findByIdAndDelete(itemId, (err) => {
			const message = err ? err : "Item deleted";
			console.log(message);
		});
		res.redirect("/");
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: itemId } } },
			(err, foundList) => {
				if (!err) {
					res.redirect("/" + listName);
				}
			}
		);
	}
});
/* === === === === */

let port = process.env.PORT;
if (port == null || port == "") {
	port = 5000;
}

app.listen(port, () => console.log("Server has started!"));
