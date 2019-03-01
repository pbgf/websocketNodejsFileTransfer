<template>
    <el-container>
        <el-header>
            <el-col :span="2">
                <a  href="#"><img width="30px" :src="require('../assets/云.png')"></a>
                <h2 class="title">网络云盘</h2>
            </el-col>
        </el-header>
        <el-main>
            
            <el-row>
                <el-col :span="24" >
                    <div class="content" :style="'height:'+autoHeight+'px'"> 
                        <ul class="list-group">
                            <li class="list-group-item flex-container">
                                <span class="title_span">当前路径:{{currentpath}}
                                    <a class="back" @click="back" href="#">返回上一级</a>
                                    <el-button @click="mkdirDialog">新建文件夹</el-button>
                                    <input id='uploadInput' type="file">
                                    <el-button @click="upload">上传文件</el-button>
                                </span>
                            </li>
                            <li v-for="(item,index) in list" :key="index" class="list-group-item flex-container">
                                <img width="35px" :src="getIcon(item.type)">
                                <span class="title_span"><a @click="click_item(item,$event)" @dblclick="dblclick(item,$event)" href="#">{{item.name}}</a></span>
                                
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
import Canvas2Image from 'canvas2image/canvas2image'
import { Loading } from 'element-ui';
export default {
    
    data(){
        return{
            autoHeight:0,
            list:[
                {
                    type:'dir',
                    name:'static'
                },
                {
                    type:'dir',
                    name:'.idea'
                },
                {
                    type:'file',
                    name:'index.html'
                }
            ],
            form:{
                dirname:''
            },
            fileName:'',
            dialogFormVisible:false,
            ws:{},
            path:[],
            currentpath:'',
            childFiles:[],
            isresult:false
        }
    },
    methods:{
        mkdir(){
            let ws=this.ws;
            let message={};
            message.operation='mkdir';
            message.path=this.currentpath;
            message.dirname=this.form.dirname;
            ws.send(JSON.stringify(message));
            this.refresh();
            this.dialogFormVisible=false;
        },
        mkdirDialog(){
            this.dialogFormVisible=true;
        },
        refresh(){
            let ws=this.ws;
            let message={};
            message.operation='refresh';
            ws.send(JSON.stringify(message));
        },
        getIcon(type){
            let icon='';
            switch(type){
                case 'dir':
                    icon='../../static/img/18_sucai.png';
                    break;
                case 'file':
                    icon='../../static/img/unknown.png';
                    break;
            }
            return icon;
        },
        upload(){
            let file=document.querySelector('#uploadInput').files[0];
            let reader =new FileReader();
            let ws=this.ws;
            reader.readAsArrayBuffer(file);
            reader.onload=()=>{
                console.log(reader.result);
                ws.send(JSON.stringify({name:file.name,operation:'upload'}));
                ws.send(reader.result);
            }
        },
        click_item(item,event){
            let type=item.type;
            let domElement=event.target;
            let ws=this.ws;
            if(type=='dir'){
                
            }else if(type=='file'){
                let message={}
                message.operation="download";
                message.path=this.currentpath+'/'+item.name;
                message.fileName=item.name;
                this.fileName=item.name;
                ws.send(JSON.stringify(message));
            }
        },
        dblclick(dir,event){
            //发送dir的文件名 返回这个文件夹下的文件列表 更新list
            let ws=this.ws;
            let message={};
            message.operation='enter';
            message.path=dir.name;
            ws.send(JSON.stringify(message));
        },
        back(){
            let ws=this.ws;
            let message={};
            message.operation='back';
            message.path='';
            ws.send(JSON.stringify(message));
        },
        down(image) { 
            console.log(image)
            let loadingInstance = Loading.service({});
            image.onload=()=>{
                let canvas = document.createElement("canvas"); 
                canvas.width = image.width; 
                canvas.height = image.height;
                canvas.getContext("2d").drawImage(image, 0, 0); 
                
                Canvas2Image.saveAsImage(canvas,image.width,image.height,'png')
                loadingInstance.close();
            }
            
        },
    },
    mounted(){
        let that=this;
        let ws = new WebSocket("ws://localhost:3000");

        ws.onopen = function(evt) { 
            console.log("Connection open ...");
        };

        ws.onmessage = function(evt) {
            console.log( "Received Message: " + evt.data);
            if(typeof(evt.data)=='object'){
                let link = document.createElement('a');
                link.href = window.URL.createObjectURL(evt.data);
                link.download = that.fileName;
                link.click();
                window.URL.revokeObjectURL(link.href);
            }else{
                let response=JSON.parse(evt.data);
                if(response.type=='file'){
                    let mime={}
                    switch(response.mime){
                        case 'txt':
                            mime.type='text/plain;charset=utf-8';
                            let blob = new Blob([response.data], mime);
                            saveAs(blob, response.name);//saveAs(blob,filename)
                            break;
                        case 'img':
                            mime.type='image/png'
                            let img =document.createElement('img');
                            img.src=response.data;
                            let canvas=that.down(img);
                            //that.down(canvas,mime.type);
                            break;
                        case 'mp4':
                            mime.type='audio/mp4'
                            break;
                    }
                    
                    
                }else if(response.type=='message'){
                    that.$message('文件已上传');
                    that.refresh();
                }else{
                    that.path=response.path;
                    that.currentpath=that.path.join('/');
                    that.list=response.files;
                }
            }
            
            
        };

        ws.onclose = function(evt) {
            console.log("Connection closed.");
        };   
        this.ws=ws;
        window.onresize =function(){
            that.autoHeight=document.documentElement.clientHeight-100;
        }
        
		// var content = "这是直接使用HTML5进行导出的";
		// var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
		// saveAs(blob, "file.txt");//saveAs(blob,filename)
		
    }
}
</script>
<style lang="less" scoped>
    .el-header {
        background-color: #eff4f8;
        color: #333;
        text-align: center;
        line-height: 60px;
        .title{
            float:left;
        }
    }
    .content{
        min-height:400px;
        max-height: 900px;
        border: 1px solid #d8dfea;
        border-radius: 5px;
        a{
            text-decoration: none;
        }
        a:hover {
            color: #3b8cff;
        }
        .list-group{
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
            .back{
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
                border: 1px solid rgba(0,0,0,.125);
            }
            .flex-container{
                display: flex;
                align-items: center;
                .title_span{
                    margin-left: 10px;
                    font-size: 16px;
                    button{
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
  

  
  body > .el-container {
    margin-bottom: 40px;
  }
  
</style>
