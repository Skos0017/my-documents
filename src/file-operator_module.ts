import * as fs from 'fs';

export function readFilePromise(fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(__dirname + fileName, 'utf8', function(err, data: string) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// fileName = "/userData.json"
// data = '[{"email": "123@gmail.com"}]'
export function writeFilePromise(fileName: string, data: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // src/userData.json
        fs.writeFile(__dirname + fileName, data, 'utf8', (err) => {
            if (err) {
                reject(err);
            }
            resolve('success');
        });
    });
}