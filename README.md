# danmaku server

***

[简体中文(Simplified Chinese)](./README_zhcn.md)

**The webpage project:**[damnaku-webpage](https://github.com/LuoXishuang0712/danmaku-webpage)

## Whis is this project

This is an backend implements about real-time Danmaku in living.

If you do not know which is Danmaku, maybe you need to read the README in [this project](https://github.com/LuoXishuang0712/danmaku-webpage) first.

## How to run this project

1. Install [NodeJS](https://nodejs.org/en/) and [MySQL](https://www.mysql.com/)
2. Run [db.sql](./db.sql) in this project to create database in your MySQL server.
3. Create user and grant privilege on database \`danmaku\`(the database create by [db.sql](./db.sql))
    ```sql
    grant ALL PRIVILEGES on danmaku.* to 'danmaku'@localhost identified by 'Danmaku20120712';
    ```
    **Be caution if your MySql is not running on localhost, please modify the host address in the sql before.**
4. Modify db_config in [mysql.js](./src/mysql.js) if your MySQL server dose not match the configurations.
5. Open terminal and switch to the folder of this project.
6. Run `npm i -s` to install dependencies.
7. Run `node index.js`

## Which port dose this project use

* `TCP8000` for HTTP request
* `TCP8001` for WebSocket connection

## If you want to develop on it

* As `node` will not hot reload when source file changed, you can consider use `hotnode` to fix it.
* The Websocket part and login/living api part is totally separated, but frontend need HTTP api to login(get/renew token from database)/start streaming and WebSocket to receive data from server.
