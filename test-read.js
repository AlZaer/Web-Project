const fs = require('fs');

fs.readFile('accounts.json', 'utf8', (err, data) => {
    if (err) {
        console.log("❌ خطأ:", err);
    } else {
        console.log("✅ محتوى الملف:", data);
    }
});
