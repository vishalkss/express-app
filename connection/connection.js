const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://user:user@cluster0.lschs.mongodb.net/user?retryWrites=true&w=majoritymongodb://localhost:27017";

var _db;

module.exports = {

    connectToServer: function (callback) {
        MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
            _db = client.db('user');
            return callback(err);
        });
    },

    getDb: function () {
        return _db;
    }
};

