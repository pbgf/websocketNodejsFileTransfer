
let ws = require('nodejs-websocket')
let fs = require('fs')
let fileName='';
let PORT = 3000
let path=[];
// on就是addListener，添加一个监听事件调用回调函数
// Scream server example:"hi"->"HI!!!",服务器把字母大写
let server = ws.createServer(function(conn){
    function sendFiles(){
        let files=fs.readdirSync('./dist/'+path.join('/'));
        let response={};
        let components = [];
        files.forEach(function (item, index) {
            let stat = fs.lstatSync("./dist/" + path.join('/')+'/'+ item)
            let file={}
            file.name=item;
            if (stat.isDirectory() === true) {
                file.type="dir";
            }else if(stat.isFile() === true){
                file.type="file";
            }
            components.push(file)
        })
        response.path=path;
        response.files=components;
        response.type='cd'
        conn.sendText(JSON.stringify(response)); 
    }
    console.log('New connection')
    sendFiles();
    conn.on("binary", function (inStream) {
        // Empty buffer for collecting binary data
        var data = Buffer.alloc(0)
        console.log(inStream)
        inStream.on("readable", function () {
            var newData = inStream.read()
            if (newData)
                data = Buffer.concat([data, newData], data.length+newData.length)
        })
        inStream.on("end", function () {
            console.log("Received " + data.length + " bytes of binary data")
            console.log(data)
            fs.writeFile('./dist/'+path.join('/')+'/'+ fileName, data, (err) => {
                if (err) throw err;
                console.log('文件已保存');
                let response={};
                response.message="文件已保存";
                response.type='message';
                conn.sendText(JSON.stringify(response));
            });
        })
    })
    conn.on("text",function(str){
        
        
        console.log("Received"+str)
        
        let op=JSON.parse(str);
        
        
        if(op.operation=='enter'){
            path.push(op.path) 
        }else if(op.operation=='back'){
            path.pop();
        }else if(op.operation=='download'){
            console.log(op.fileName)
            fs.readFile('./dist/'+op.path,(err,data)=>{
                if (err) throw err;
                
                
                //conn.sendText(JSON.stringify(response));
                conn.sendBinary(data);
            })
        }else if(op.operation=='mkdir'){
            fs.mkdir('./dist/'+op.path+'/'+op.dirname,(err)=>{
                console.log(err);
                
            })
        }else if(op.operation=='refresh'){
            
        }else if(op.operation=='upload'){
            fileName=op.name;

        }
        // conn.sendText(str.toUpperCase()+"!!!") //大写收到的数据
        
        sendFiles();
    })
    conn.on("close",function(code,reason){
        console.log("connection closed")
    })
    conn.on("error",function(err){
        console.log("handle err")
        console.log(err)
    })
}).listen(PORT)

console.log('websocket server listening on port ' + PORT)
