const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { parse } = require('querystring');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
    //Login method
    if (req.method === 'POST' && req.url === '/login') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const parsedData = parse(body);
            const email = parsedData.email;
            const password = parsedData.password;

            fs.readFile('accounts.json', 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error reading accounts file');
                    return;
                }

                let accounts = JSON.parse(data);
                const user = accounts.find(u => u.email === email);

                if (!user) {
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.end('This email is not registered');
                } else {
                    bcrypt.compare(password, user.password, (err, result) => {
                        if (result) {
                            res.writeHead(302, {
                                'Set-Cookie': `email=${encodeURIComponent(email)}; Max-Age=10; HttpOnly`,
                                'Location': '/clipboard.html'
                            });
                            res.end();
                        } else {
                            res.writeHead(401, { 'Content-Type': 'text/plain' });
                            res.end('Invalid password');
                        }
                    });
                }
            });
        });

        return;
    }

    //Register method
    if (req.method === 'POST' && req.url === '/register') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const username = params.get('username');
            const email = params.get('email');
            const password = params.get('password');
            //const confirmPassword = params.get('confirm_password');

            console.log("🚀 Reading accounts.json from path:", __dirname + '/accounts.json');
            if (!fs.existsSync('accounts.json')) {
                console.log("accounts.json does not exist");
            } else {
                console.log("account.json file exists");
            }
            fs.readFile('accounts.json', 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end('Error reading accounts file');
                }

                let accounts = [];
                try {
                    accounts = JSON.parse(data);
                } catch (e) {
                    return res.end('Invalid accounts.json format');
                }

                const userExists = accounts.some(acc => acc.username === username || acc.email === email);
                if (userExists) {
                    res.writeHead(409, { 'Content-Type': 'text/plain' });
                    return res.end('User already exists');
                }

                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        res.writeHead(500);
                        return res.end('Error encrypting password');
                    }

                    const newUser = {
                        username,
                        email,
                        password: hashedPassword
                    };
                    accounts.push(newUser);

                    fs.writeFile('accounts.json', JSON.stringify(accounts, null, 2), (err) => {
                        if (err) {
                            res.writeHead(500);
                            return res.end('Error saving user');
                        }

                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('User registered successfully!');
                    });
                });
            });
        });
        return;
    }

    //Logout method
    if (req.method === 'GET' && req.url === '/logout') {
        res.writeHead(302, {
            'Set-Cookie': 'email=; Max-Age=0; HttpOnly',
            'Location': '/'
        });
        res.end();
        return;
    }
    // if (req.method === 'GET' && req.url === '/accounts.json') {
    //     res.writeHead(403, { 'Content-Type': 'text/plain' });
    //     res.end('Access denied');
    //     return;
    // }    

    //Serve static files
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.json': 'application/json',
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

    // ✅ حماية صفحة clipboard.html باستخدام الكوكي
    if (req.url === '/clipboard.html') {
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = decodeURIComponent(value);
            return acc;
        }, {});

        if (!cookies.email) {
            res.writeHead(302, { 'Location': '/' }); // نعيده إلى الصفحة الرئيسية إن لم يسجل دخول
            res.end();
            return;
        }
    }

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
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});