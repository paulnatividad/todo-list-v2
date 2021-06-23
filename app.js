//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose connect
mongoose.connect("mongodb+srv://admin:mongodbtodolist@cluster0.gifqn.mongodb.net/todolistDB",{useNewUrlParser: true});

// create schema
const itemSchema ={
  name:String
};

// db model
const Item = mongoose.model("Item", itemSchema);

// create new item
const item1 = new Item({
  name:"Welcome to my to do list"
});

const item2 = new Item({
  name:"Hit the + button to add a new item"
});

const item3 = new Item({
  name:"<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

// Schema for custom links
const listSchema={
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


// Item.insertMany(defaultItems,function(err){
//   if(err){
//     console.log(err);
//   }
//   else{
//     console.log("Successfully");
//   }
// });

app.get("/", function(req, res) {

  Item.find({},function(err, foundItems){
    // console.log(foundItems);
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  });

});

// ---------- Insert Post----------------
app.post("/", function(req, res){
  // Text-input
  const itemName = req.body.newItem;
  // Add Button
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName ==="Today"){
    //Mongoose shortcut - save into our collections of items
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      // 'items' is from listSchema
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});


//-------- DELETE-Post----------------
app.post("/delete", function(req, res){
  // To get id of what we checked
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

// -----Since we are redirected to the home route "/" once we  
// delete an item. Used conditional

  if(listName ==="Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item");
        
        // to refresh page - redirected to home route once we delete item
        res.redirect("/");
      }else{
        console.log(err);
      }
    });
  } else {
    // $pull is mongodb operator
    List.findOneAndUpdate({name:listName}, 
      {$pull: {items: {_id: checkedItemId}}},
       function(err, foundList){
        if(!err){
          res.redirect("/" + listName);
        }
       });
  }

 
});


// ---------Creating dynamic routes--------
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  // Check if unique
  List.findOne({name:customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/"+customListName);
      }else{
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems:foundList.items})
      }
    }
  });
  
});

// --------------ABOUT-----------------
app.get("/about", function(req, res){
  res.render("about");
});

// -------------------------------
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
