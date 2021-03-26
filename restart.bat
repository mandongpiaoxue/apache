@cd /d %~dp0
@forever stop server.js
@forever start server.js