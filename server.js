const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { parse } = require('querystring');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
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
                    res.end('خطأ في قراءة الحسابات');
                    return;
                }

                let accounts = JSON.parse(data);
                const user = accounts.find(u => u.email === email);

                if (!user) {
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.end('هذا المستخدم غير موجود');
                } else {
                    bcrypt.compare(password, user.password, (err, result) => {
                        if (result) {
                            res.writeHead(302, { 'Location': '/clipboard.html' });
                            res.end();
                        } else {
                            res.writeHead(401, { 'Content-Type': 'text/plain' });
                            res.end('كلمة المرور غير صحيحة');
                        }
                    });
                }
            });
        });

        return;
    }

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

            console.log("🚀 Reading accounts.json from path:", __dirname + '/accounts.json');
            if (!fs.existsSync('accounts.json')) {
                console.log("❌ ملف accounts.json غير موجود!");
            } else {
                console.log("✅ ملف accounts.json موجود!");
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

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
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
