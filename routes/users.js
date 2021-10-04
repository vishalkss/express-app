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

  if (req.file) {
    var parse = require('csv-parse');

    var csvData = [];
    var resultData = {};
    fs.createReadStream(req.file.path)
      .pipe(parse({ delimiter: ',' }))
      .on('data', function (csvrow) {
        csvData.push(csvrow);
      })
      .on('end', function () {
        if (csvData && csvData.length > 0) {
          var headers = [];
          var userData = [];
          var totalSales = 0;
          csvData[0].forEach(element => {
            headers.push(element);
          });


          let monthWiseData = {};
          let monthWisePopularItem = {};
          let monthWiseItemRev = {};
          let maxMinAvg = {};

          csvData.forEach((element, index) => {
            let user = {};
            if (index > 0) {


              // Total sales of the store
              if (headers[4] == "Total Price") {
                totalSales = totalSales + parseInt(element[4]);
              }

              // Month wise sales totals
              if (headers[0] == "Date") {
                let date = element[0];
                let res = date.split('-');
                let tempDate = res[0] + "-" + res[1];
                if (monthWiseData[tempDate]) {
                  monthWiseData[tempDate] = monthWiseData[tempDate] + parseInt(element[4]);
                } else {
                  monthWiseData[tempDate] = parseInt(element[4]);
                }
              }

              // Most popular item (most quantity sold) in each month
              if (headers[1] == "SKU") {
                let date = element[0];
                let res = date.split('-');
                let tempDate = res[0] + "-" + res[1];
                let tempItem = element[1];
                let item_name = tempItem + ":-" + tempDate;

                if (monthWisePopularItem[item_name]) {
                  monthWisePopularItem[item_name] = monthWisePopularItem[item_name] + parseInt(element[3]);
                } else {
                  monthWisePopularItem[item_name] = parseInt(element[3]);
                }

                if (monthWiseItemRev[item_name]) {
                  monthWiseItemRev[item_name] = monthWiseItemRev[item_name] + parseInt(element[4]);
                } else {
                  monthWiseItemRev[item_name] = parseInt(element[4]);
                }

                if (maxMinAvg[item_name]) {
                  maxMinAvg[item_name] = maxMinAvg[item_name] + "," + element[3];
                } else {
                  maxMinAvg[item_name] = element[3];
                }
              }

              headers.forEach((headerData, key) => {
                user[headerData] = element[key];
              });
            }
            userData.push(user);
          });

          let monthWisePopularItemData = {};
          let mwpid = {};
          Object.keys(monthWisePopularItem).forEach(function (keys) {
            element = keys.split(":-");
            if (monthWisePopularItemData[element[1]] && (monthWisePopularItemData[element[1]] < monthWisePopularItem[keys])) {
              monthWisePopularItemData[element[1]] = monthWisePopularItem[keys];
              mwpid[element[1]] = element[0];
            } else if (!monthWisePopularItemData[element[1]]) {
              monthWisePopularItemData[element[1]] = monthWisePopularItem[keys];
              mwpid[element[1]] = element[0];
            }

          });
          let mpiem = [];
          mpiem['Most popular item Each Month'] = mwpid;
          mpiem['Most popular item Quantity sold'] = monthWisePopularItemData;


          let monthWiseItemRevData = {};
          let mwird = {};
          Object.keys(monthWiseItemRev).forEach(function (keys) {
            element = keys.split(":-");
            if (monthWiseItemRevData[element[1]] && (monthWiseItemRevData[element[1]] < monthWiseItemRev[keys])) {
              monthWiseItemRevData[element[1]] = monthWiseItemRev[keys];
              mwird[element[1]] = element[0];
            } else if (!monthWiseItemRevData[element[1]]) {
              monthWiseItemRevData[element[1]] = monthWiseItemRev[keys];
              mwird[element[1]] = element[0];
            }

          });

          let mwirdFinal = [];
          mwirdFinal['Items generating most revenue Name'] = mwird;
          mwirdFinal['Items generating most revenue '] = monthWiseItemRevData;


          let maxMinAvgObj = {};
          Object.keys(maxMinAvg).forEach(function (keys) {
            element = keys.split(":-");
            if (element[0] == mwpid[element[1]]) {
              let tempQuant = maxMinAvg[keys].split(",");
              let min = Math.min(...tempQuant);
              let max = Math.max(...tempQuant);
              let sum = 0;
              for (let i = 0; i < tempQuant.length; i++) {
                sum += parseInt(tempQuant[i], 10);
              }
              let avg = sum / tempQuant.length;
              let arr = []
              arr['item'] = element[0];
              arr['min'] = min;
              arr['max'] = max;
              arr['avg'] = avg;
              maxMinAvgObj[element[1]] = arr;
            };

          });

          resultData['Total sales of the store'] = totalSales
          resultData['Month wise sales totals'] = monthWiseData;
          resultData['Most popular item'] = mpiem;
          resultData['Items generating most revenue in each month'] = mwirdFinal;
          resultData['Min, max & average number of orders each month For the most popular item'] = mwirdFinal;
        }

        res.send(resultData);
      });
  } else {
    res.status(500).json({ error: 'Please add a file' })
  }
});
module.exports = router;