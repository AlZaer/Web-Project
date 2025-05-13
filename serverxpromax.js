const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { parse } = require('querystring');
const { error } = require('console');

const hostname = "127.0.0.1";
const port = 3000;

const server = http.createServer((req, res) => {
    //Login method
    if (req.method === "POST" && req.url === "/login"){
        let body = "";

        req.on("data", chunk => {
            body +=chunk.toString();
        });

        req.on("end", () => {
            const { email, password } = JSON.parse(body);

            fs.readFile("accounts.json", "utf8", (err, data) => {
                if (err) {
                    res.writeHead(500, {'Content-Type':'application/json'});
                    res.end(JSON.stringify({success: false, message: 'Error reading account file'}));
                    return;
                }

                let accounts = JSON.parse(data);
                const user = accounts.find(u => u.email === email);

                if(!user){
                    res.writeHead(401, {'Content-Type':'application/json'});
                    res.end(JSON.stringify({success: false, message: 'This email is not registered'}));
                }
                else{
                    bcrypt.compare(password, user.password, (err, result) => {
                        if(result){
                            res.writeHead(200, {
                            'Set-Cookie': `email=${encodeURIComponent(email)}; Max-Age=10; HttpOnly`,
                            'Content-Type': 'application/json'
                            });
                            res.end(JSON.stringify({ success: true }));
                        }
                        else{
                            res.writeHead(401,{'Content-Type': 'application/json'});
                            res.end(JSON.stringify({success: false, message: 'Invalid password'}));
                        }
                    });
                }
            });
        });
        return;
    }

    //Register method
    if(req.method === 'POST' && req.url === '/register'){
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const {username, email, password} = JSON.parse(body);

            fs.readFile('accounts.json','utf8',(err,data) => {
                if(err && err.code !== 'ENOENT'){
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({success: false, message: 'Server error reading accounts'}));
                    return;
                }
                
                let accounts = [];

                if(data){
                    try{
                        accounts = JSON.parse(data);
                    }
                    catch(e){
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Corrupted accounts file' }));
                        return;
                    }
                }

                //ensuring the existing of the account
                const existingUser = accounts.find(u => u.email === email);
                if(existingUser){
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Email already registered' }));
                    return;
                }

                //encryption the password
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if(err){
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Error encrypting password' }));
                        return;
                    }

                    const newUser = {username, email, password: hashedPassword};
                    accounts.push(newUser);

                    fs.writeFile(`accounts.json`, JSON.stringify(accounts, null, 2), err => {
                        if(err){
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: 'Failed to save account' }));
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    });
                });
            });
        });
        return;
    }



    //file datas
    let filePath = '.' + req.url;
    if(filePath === './'){
        filePath = './login_page.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    //cookies
    if(req.url === '/clipboard.html'){
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = decodeURIComponent(value);
            return acc;
        }, {});

        if(!cookies.email){
            res.writeHead(302, {'location':'/'});
            res.end();
            return;
        }
    };

    //files read part
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});