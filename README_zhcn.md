# danmaku server

***

[English](./README.md)

**前端项目:**[damnaku-webpage](https://github.com/LuoXishuang0712/danmaku-webpage)

## 这是什么项目

这是一个关于直播实时弹幕的后端项目。

如果您不知道什么是“弹幕”的话，您可以看一下[前端项目](https://github.com/LuoXishuang0712/danmaku-webpage)中的README文件，我放上了一些关于弹幕的信息。

## 怎么运行这个项目

1. 安装 [NodeJS](https://nodejs.org/en/) 和 [MySQL](https://www.mysql.com/)，它们都是常见的服务端程序，你可以从搜索引擎中找到它们的安装教程，此处不再赘述。
2. 在MySQL服务器中运行项目中的 [db.sql](./db.sql) 文件，以创建后端服务器会用到的数据库与数据表。
3. 创建新用户并给予数据库 \`danmaku\`(由 [db.sql](./db.sql) 文件声明并创建的数据库) 上的所有权限。
    ```sql
    grant ALL PRIVILEGES on danmaku.* to 'danmaku'@localhost identified by 'Danmaku20120712';
    ```
    **注意，如果您的数据库不是运行在本地(localhost)，请修改以上SQL语句中的localhost为您的数据库服务器地址**
4. 如果您的数据库配置与默认不同，请注意修改 [mysql.js](./src/mysql.js) 中的 db_config 对象。
5. 打开终端，并切换到当前项目所在目录。
6. 安装依赖： `npm i -s`
7. 运行项目： `node index.js`

## 这个项目会用到哪些端口

* HTTP请求：TCP的`8000`端口
* WebSocket服务器：TCP的`8001`端口

## 想要继续开发

* 注意，当源文件修改时，`node` 并不会对运行中文件进行热加载，您可以考虑使用`hotnode`来承载服务器的运行，以实现热重载。
* WebSocket与HTTP 请求实现部分是完全独立的，但是前端需要两个部分都齐全才可以运行（HTTP 请求部分实现用户token的获取与更新，WebSocket部分实现服务器向客户端的通信）