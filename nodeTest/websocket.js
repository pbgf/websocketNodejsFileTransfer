const ws = require('nodejs-websocket')
const fs = require('fs')
const PORT = 3000;

let fileName = '';
let path = [];

// on就是addListener，添加一个监听事件调用回调函数
// Scream server example:"hi"->"HI!!!",服务器把字母大写
// conn ws实例
ws.createServer(conn => {
    //视图更新函数，发送列表渲染数据
    //path.join() 将数组元素转为字符串并且以/分割
    function sendFiles() {
        let files = fs.readdirSync('./guestStorge/' + path.join('/'));
        let response = {};
        let components = [];
        files.forEach(item => {
            //同步返回一个stat数组对象
            let stat = fs.lstatSync("./guestStorge/" + path.join('/') + '/' + item)
            let file = {}
            file.name = item;
            // 判断是文件夹
            if (stat.isDirectory() === true) {
                file.type = "dir";
                // 判断是文件
            } else if (stat.isFile() === true) {
                file.type = "file";
            }
            components.push(file)
        })
        response.path = path;
        response.files = components;
        response.type = 'cd'
        conn.sendText(JSON.stringify(response));
    }
    console.log('New connection')
    //新用户连接成功后发送列表
    sendFiles();
    //接受二进制数据
    conn.on("binary", inStream => {
        // 创建空buffer，buffer JavaScript二进制数据
        let data = Buffer.alloc(0)
        console.log(inStream)
        inStream.on("readable", () => {
            let newData = inStream.read()
            if (newData) {
                //拼接分段数据，将所有buffer拼接为一个新buffer
                data = Buffer.concat([data, newData], data.length + newData.length)
            }
        })
        //监听传输结束
        inStream.on("end", () => {
            console.log("Received " + data.length + " bytes of binary data")
            console.log(data)
            // 文件写入
            fs.writeFile('./guestStorge/' + path.join('/') + '/' + fileName, data, (err) => {
                // 如果发生错误就抛出错误
                if (err) throw err;
                console.log('文件已保存');
                let response = {};
                response.message = "文件已保存";
                response.type = 'message';
                conn.sendText(JSON.stringify(response));
            });
        })
    })
    //接受客户端传过来的信息， String形式
    conn.on("text", str => {
        console.log("Received" + str)
        //字符串转对象
        let op = JSON.parse(str);
        switch (op.operation) {
            case 'enter':
                path.push(op.path)
                break;
            case 'back':
                path.pop();
                break;
            case 'download':
                console.log(op.fileName)
                fs.readFile('./guestStorge/' + op.path, (err, data) => {
                    if (err) throw err;
                    //发送二进制数据流
                    conn.sendBinary(data);
                })
                break;
            case 'mkdir':
                fs.mkdir('./guestStorge/' + op.path + '/' + op.dirname, (err) => {
                    console.log(err);
                })
                break;
            case 'upload':
                fileName = op.name;
                break;
            default:
                //收到refresh，更新视图
                sendFiles()
                break;
        }
    })
    conn.on("close", (code, reason) => {
        console.log(code)
        console.log("connection closed", reason)
    })
    conn.on("error", err => {
        console.log("handle err")
        console.log(err)
    })
}).listen(PORT)

console.log('websocket server listening on port ' + PORT)