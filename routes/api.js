/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb").MongoClient
var ObjectId = require("mongodb").ObjectID

let local_db = false

const hostname = "127.0.0.1"
const port = "27017"
const database = "issue-tracker"

const MONGO_URI = local_db ? 
      `mongodb://${hostname}:${port}/${database}` : 
      "mongodb+srv://" +
      process.env.DB_USER +
      ":" +
      process.env.DB_PASS +
      "@cluster0-vakli.mongodb.net/test?retryWrites=true&w=majority"

// Database variables
var db         // database connection variable
var issues     // database collection variable

module.exports = function(app) {
  
  // Connect database
  MongoClient.connect(MONGO_URI, function(err, database) {
    if (err) console.log("Database couldn't connect")
    else {
      console.log("Database connected")
      db = database.db('issue-tracker')
      issues = db.collection('issues')
    }
  })
  
  app.route('/api/issues/:project')
  
    .get(function(req, res){
      let project = req.params.project
      let query = req.query
      if(query.open === 'false') query.open = false
      else if(query.open === 'true') query.open = true
      db.collection(project).find(query).toArray((err, result) => {
        err ? console.log(err) : res.json(result)
      })
    })  
  
    .post(function(req, res){
      let project = req.params.project
      let {
        issue_title, issue_text, created_by, assigned_to = '', status_text = '' 
      } = req.body
      if(!issue_title || !issue_text || !created_by) return res.send('Missing inputs')
      
      const created_on = new Date()
      db.collection(project).insertOne({
        issue_title, issue_text, created_by, assigned_to, status_text, created_on,
        updated_on: created_on,
        open: true        
        }, (err, result) => err ? console.log(err) : res.json(result.ops[0])
      )
    })
  
    .put(function(req, res) {
      let project = req.params.project
      let issue_id = req.body._id
      delete req.body._id
      let updateFields = req.body      
      if(!issue_id) return res.send('Missing _id')
      // Delete null fields
      for (let e in updateFields) if(!updateFields[e]) delete updateFields[e]
      if(Object.keys(updateFields).length === 0) return res.send('No fields to be updated')
      // Convert the "open" field from string to boolean
      if(updateFields.open === 'false') updateFields.open = false
      else if(updateFields.open === 'true') updateFields.open = true
      // Update date
      updateFields['updated_on'] = new Date()
      // Update the database
      db.collection(project).update(
        { _id: new ObjectId(issue_id) },
        { $set: updateFields },
        (err) => err ? console.log(err) : res.send('Issue updated')
      )      
    })
  
    .delete(function(req, res) {
      var project = req.params.project;
      let issue_id = req.body._id
      if(!issue_id) res.send("Id error")
      db.collection(project).findAndRemove(
        { _id: new ObjectId(issue_id) }, 
        (err, r) => 
        err ? res.send('Error: ', err) : res.send('Issue ' + issue_id + ' deleted'))
    })

}