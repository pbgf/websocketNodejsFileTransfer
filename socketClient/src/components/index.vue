<template>

    <el-container>
        <el-header>
            <el-col :xl="2" :lg="3" :md="4" :sm="5" :xs="7">
                <a href="#"><img width="30px" :src="require('../assets/云.png')"></a>
                <h2 class="title">网络云盘</h2>
            </el-col>
        </el-header>
        <el-main>
            <el-row>
                <el-col :span="24">
                    <div class="content" :style="'height:'+autoHeight+'px'">
                        <ul class="list-group">
                            <li class="list-group-item flex-container">
                                <span class="title_span">当前路径:{{currentpath || '根路径'}}
                                    <a class="back" @click="back" href="#">返回上一级</a>
                                    <el-button @click="mkdirDialog">新建文件夹</el-button>
                                    <input id='uploadInput' type="file" style="margin-left:50px">
                                    <el-button @click="upload">上传文件</el-button>
                                </span>
                            </li>
                            <li v-for="(item,index) in list" :key="index" class="list-group-item flex-container">
                                <img width="35px" :src="getIcon(item.type)">
                                <span class="title_span"><a @click="click_item(item,$event)"
                                        href="#">{{item.name}}</a></span>
                            </li>
                        </ul>
                    </div>
                </el-col>
            </el-row>
        </el-main>
        <el-dialog title="新建文件夹" :visible.sync="dialogFormVisible">
            <el-form :model="form">
                <el-form-item label="文件名" label-width="120px">
                    <el-input v-model="form.dirname" autocomplete="off"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="mkdir">确 定</el-button>
            </div>
        </el-dialog>
    </el-container>
</template>

<script>
    export default {
        mounted() {
            this.initWs()
        },
        data() {
            return {
                autoHeight: 0,
                list: [],
                form: {
                    dirname: ''
                },
                fileName: '',
                dialogFormVisible: false,
                ws: {},
                path: [],
                currentpath: '',
                childFiles: [],
                isresult: false
            }
        },
        methods: {
            initWs() {
                //避免丢失作用域中丢失this
                const that = this;
                //初始化websocket实例
                const ws = new WebSocket("ws://localhost:3000");
                //监听socket开启
                ws.onopen = function (evt) {
                    console.log("Connection open ...");
                };
                //监听服务器消息 
                ws.onmessage = function (evt) {
                    console.log("Received Message: " + evt.data);
                    //给文件创建下链接
                    if (typeof (evt.data) == 'object') {
                        let link = document.createElement('a');
                        link.href = window.URL.createObjectURL(evt.data);
                        link.download = that.fileName;
                        document.documentElement.appendChild(link);
                        //触发click事件
                        link.click();
                        link.remove();
                        setTimeout(function () { //延时释放
                            URL.revokeObjectURL(link.href); //用URL.revokeObjectURL()来释放这个object URL
                        }, 100);
                    } else {
                        let response = JSON.parse(evt.data);
                        if (response.type == 'message') {
                            that.$message('文件已上传');
                            that.refresh();
                        } else {
                            that.path = response.path;
                            that.currentpath = that.path.join('/');
                            that.list = response.files;
                        }
                    }
                };
                //监听链接断开事件
                ws.onclose = function (evt) {
                    console.log("Connection closed.");
                };
                //在页面上挂载ws实例
                this.ws = ws;
                window.onresize = function () {
                    that.autoHeight = document.documentElement.clientHeight - 100;
                }
            },
            //创建目录
            mkdir() {
                const ws = this.ws;
                let message = {};
                message.operation = 'mkdir';
                message.path = this.currentpath;
                message.dirname = this.form.dirname;
                ws.send(JSON.stringify(message));
                this.refresh();
                this.dialogFormVisible = false;
            },
            mkdirDialog() {
                this.dialogFormVisible = true;
            },
            //更新视图
            refresh() {
                const ws = this.ws;
                let message = {};
                message.operation = 'refresh';
                ws.send(JSON.stringify(message));
            },
            //获取图标
            getIcon(type) {
                let icon = '';
                switch (type) {
                    case 'dir':
                        icon = require('../assets/18_sucai.png');
                        break;
                    case 'file':
                        icon = require('../assets/unknown.png');
                        break;
                }
                return icon;
            },
            // 上传
            upload() {
                let file = document.querySelector('#uploadInput').files[0];
                //创建reader实例
                const reader = new FileReader();
                const ws = this.ws;
                //读取文件
                reader.readAsArrayBuffer(file);
                //读取完成后发送给服务器
                reader.onload = () => {
                    console.log(reader.result);
                    ws.send(JSON.stringify({
                        name: file.name,
                        operation: 'upload'
                    }));
                    ws.send(reader.result);
                    this.refresh();
                }
            },
            //点击事件
            click_item(item, event) {
                console.log(item)
                let type = item.type;
                let domElement = event.target;
                let ws = this.ws;
                //判断点击类型，dir为点击目录，file为点击文件
                if (type == 'dir') {
                    //点击目录，则发送dir的文件名 返回这个文件夹下的文件列表 更新list
                    this.dblclick(item, event)
                } else if (type == 'file') {
                    //点击文件则创建下载链接
                    let message = {}
                    message.operation = "download";
                    message.path = this.currentpath + '/' + item.name;
                    message.fileName = item.name;
                    this.fileName = item.name;
                    ws.send(JSON.stringify(message));
                    this.refresh();
                }
            },
            // 进入目录
            dblclick(dir, event) {
                console.log(dir)
                //发送dir的文件名 返回这个文件夹下的文件列表 更新list
                let ws = this.ws;
                let message = {};
                message.operation = 'enter';
                message.path = dir.name;
                ws.send(JSON.stringify(message));
                this.refresh();
            },
            // 返回上级
            back() {
                let ws = this.ws;
                let message = {};
                message.operation = 'back';
                message.path = '';
                ws.send(JSON.stringify(message));
                this.refresh();
            },
        }
    }
</script>
<style lang="less" scoped>
    .el-header {
        background-color: #eff4f8;
        color: #333;
        text-align: center;
        line-height: 60px;

        .title {
            float: left;
        }
    }

    .content {
        min-height: 400px;
        max-height: 900px;
        border: 1px solid #d8dfea;
        border-radius: 5px;

        a {
            text-decoration: none;
        }

        a:hover {
            color: #3b8cff;
        }

        .list-group {
            display: -ms-flexbox;
            display: -webkit-box;
            display: flex;
            -ms-flex-direction: column;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            flex-direction: column;
            padding-left: 0;
            margin-bottom: 0;
            text-align: left;

            .back {
                margin-left: 10px;
            }

            .list-group-item {
                position: relative;
                height: 34px;
                line-height: 34px;
                font-size: 15px;
                padding: .75rem 1.25rem;
                margin-bottom: -1px;
                background-color: #fff;
                border: 1px solid rgba(0, 0, 0, .125);
            }

            .flex-container {
                display: flex;
                align-items: center;

                .title_span {
                    margin-left: 10px;
                    font-size: 16px;

                    button {
                        margin-left: 40px;
                    }
                }
            }
        }

    }



    .list-group-item:first-child {
        border-top-left-radius: .25rem;
        border-top-right-radius: .25rem;
    }



    body>.el-container {
        margin-bottom: 40px;
    }
</style>