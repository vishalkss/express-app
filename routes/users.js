var express = require('express');
var router = express.Router();
const multer = require('multer')
const upload = multer({ dest: 'templates/' })
const fs = require('fs');




/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.get("/search-user", async (req, res, next) => {
  var conn = req.db.db("user");
  var search_input = req.param("search_input"); //required field
  // Validate user input
  if (!(search_input)) {
    res.status(400).send("All input is required");
  }
  // Validate if user exist in our database
  searchUserBasedOnInput(conn,search_input).then(response1 => {
    if (response1 != "" && response1.length >= 1) {
      res.json({
        status: "200",
        response: response1,
      });
    } else {
      res.json({
        status: "401",
        response: "Error",
      });
    }

  });

  async function searchUserBasedOnInput(conn,search_input) {

    const oldUser = searchUser(conn,search_input);
    const promises = [oldUser];

    try {
      const result = await Promise.all(promises);

      // you can do something with the result
      return oldUser;

    } catch (error) {
      console.log(error)
    }
  }


  function searchUser(conn,search_input) {
    return new Promise((resolve, reject) => {
        var query = { $or: [{ "name": { $regex: ".*" + search_input + ".*" } }, { "mobile_number": { $regex: ".*" + search_input + ".*" } }] };
        conn.collection("user").find(query).toArray(function (error, results) {
          if (error) {
            return reject(error);
          }
          return resolve(results);
        });
    });
  };

});


router.post('/upload-data', upload.single('file'), function (req, res) {
  // req.file is the name of your file in the form above, here 'uploaded_file'
  // req.body will hold the text fields, if there were any 
  console.log(req.file, req.body)
  if (req.file){
    var tmp_path = req.file.path;

    /** The original name of the uploaded file
        stored in the variable "originalname". **/
    var target_path = 'templates/' + req.file.originalname;

    /** A better way to copy the uploaded file. **/
    var src = fs.createReadStream(tmp_path);
    var dest = fs.createWriteStream(target_path);
    var parse = require('csv-parse');

    var csvData = [];
    fs.createReadStream(req.file.path)
      .pipe(parse({ delimiter: ',' }))
      .on('data', function (csvrow) {
        console.log(csvrow);
        //do something with csvrow
        csvData.push(csvrow);
      })
      .on('end', function () {
        //do something with csvData
        console.log(csvData);
        res.send(csvData);
      });
  }
});
module.exports = router;
