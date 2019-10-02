const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')
const images = require('./images')

var config = []
var ips = []
var index = ''

fs.readFile(path.join(__dirname, 'config.json'), (err, data) => {
    config = JSON.parse(data.toString())
    ips = config.deny.ips
    index = config.index
})

http
    .createServer(function (req, res) {
        /* 獲取遠程IP */
        let remoteIp = req.socket.remoteAddress.substr(7)
        /* 屏蔽指定IP */
        ips.forEach(ip => {
            if (ip === remoteIp) res.end('404 file no found!')
        })
        let host = req.headers.host
        /* 如果通過非80端口接入，會存在protocol，否則為null */
        let protocol = url.parse(host).protocol
        let urlObject = url.parse(req.url, true)
        let pathname = urlObject.pathname
        pathname = decodeURIComponent(pathname)
        let ext = path.parse(pathname).ext
        if (protocol) host = protocol.slice(0, -1)
        let server = config.hosts.find((v, i) => {
            return v.host === host
        })
        /* 讀取匹配的路徑 */
        if (!server.dir) res.end('域名为指向路径!')
        fs.readdir(server.dir, (error, data) => {
            if (error) res.end('域名指向路径错误')
        })
        switch (ext) {
            /* 對.htm和.htm文件進行頭設置，防止部分html或htm文件無法解讀 */
            case '.html':
                res.setHeader('Content-Type', 'text/html;chartset=utf-8')
                break
            case '.htm':
                res.setHeader('Content-Type', 'text/html;chartset=utf-8')
                break
            case '.txt':
                res.setHeader('Content-Type', 'text/plain;chartset=utf-8')
                break
            case '.css':
                res.setHeader('Content-Type', 'text/css;chartset=utf-8')
                break
            case '.doc':
                res.setHeader('Content-Type', 'application/msword;chartset=utf-8')
                break
        }
        let dir = server.dir
        let filePath = dir + pathname
        /* 以文件夾形式讀取Url */
        fs.readdir(filePath, (ed, dd) => {
            if (ed) {
                /* 以省略後綴名html的形式讀取文件 */
                readFile(filePath + '')
                    .then(d1 => {
                        res.end(d1)
                    }, e1 => {
                        res.setHeader('Content-Type', 'text/html;chartset=utf-8')
                        return readFile(filePath + '.htm')
                    })
                    .then(d2 => {
                        res.end(d2)
                    }, e2 => {
                        return readFile(filePath + '.html')
                    })
                    .then(d3 => {
                        res.end(d3)
                    }, e3 => {
                        res.end('404 file no found!')
                    })
            } else {
                /* 讀取目錄下的index.html文件 */
                res.setHeader('Content-Type', 'text/html;chartset=utf-8')
                readFile(filePath + '/' + index + '.html')
                    .then(d1 => {
                        res.end(d1)
                    }, e1 => {
                        return readFile(filePath + '/' + index + '.htm')
                    })
                    .then(d2 => {
                        res.end(d2)
                    }, e2 => {
                        return readFile(filePath + '/' + index)
                    })
                    .then(d3 => {
                        res.end(d3)
                    }, e3 => {/* 讀取目錄下的文件 */
                        let pna = pathname.split('/')
                        pna.pop()
                        let name = pna.pop()
                        let pn = pathname.slice(0, -1)
                        let pnl = pn.lastIndexOf('/')
                        let upPath = pathname.slice(0, pnl + 1)
                        let ds = `
                            <meta charset="UTF-8">
                            <title>${name}</title>
                            <style>
                                body{padding:20px 50px;}
                            </style>
                            <a style="display:block;height:32px;" href="${upPath}">${images.back}</a>
                        `
                        dd.forEach(file => {
                            if (file.search('\\\.') > -1) {
                                ds += `<a style="display:block;height:32px;" href="${pathname + file}"><span style="height:32px;line-height:32px;float:left;display:block;">${images.file}</span><span style="height:32px;line-height:32px;float:left;display:block;">${file}</span></a>`
                            } else {
                                ds += `<a style="display:block;height:32px;" href="${pathname + file + '/'}"><span style="height:32px;line-height:32px;float:left;display:block;">${images.folder}</span><span style="height:32px;line-height:32px;float:left;display:block;">${file}</span></a>`
                            }
                        })
                        res.end(ds)
                    })
            }
        })
    })
    .listen(80, function (err) {
        if (err) console.log(err)
    })

function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve(data)
            }
        })
    })
}