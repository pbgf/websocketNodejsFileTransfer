var express = require('express');
var app = express();
var fs = require("fs");
 
var bodyParser = require('body-parser');
var multer  = require('multer');

app.use(express.static('dist'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/'}).array('image'));

app.get('/file', function (req, res) {
   let option={withFileTypes:true}
   let files=fs.readdirSync('./dist/static');
   let components = [];
   files.forEach(function (item, index) {
      let stat = fs.lstatSync("./dist/static/" + item)
      console.log(typeof(stat))
      let file={}
      file.name=item;
      if (stat.isDirectory() === true) {
         file.type="dir"
      }else if(stat.isFile() === true){
         file.type="file";
      }
      components.push(file)
   })
   // res.sendFile( __dirname + "/" + "dist/index.html" );
   console.log(components)
   res.send(components.toString())
})

app.post('/file_upload', function (req, res) {
 
   console.log(req.files[0]);  // 上传的文件信息
 
   var des_file = __dirname + "/" + req.files[0].originalname;
   fs.readFile( req.files[0].path, function (err, data) {
        fs.writeFile(des_file, data, function (err) {
         if( err ){
              console.log( err );
         }else{
               response = {
                   message:'File uploaded successfully', 
                   filename:req.files[0].originalname
              };
          }
          console.log( response );
          res.end( JSON.stringify( response ) );
       });
   });
})
 
var server = app.listen(8081, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
 
})
