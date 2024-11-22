import { Request, Response, NextFunction } from 'express';
import { readFilePromise, writeFilePromise } from '../file-operator_module'
import { User } from '../User'



export function replaceTemplateValues(fileName: string, userData: User): Promise<string> {
    return new Promise((resolve, reject) => {
        readFilePromise(fileName)
            // resolve
            .then(function(data: string) {
                data = data.replace('%username%', userData.username)
                    .replace('%firstname%', userData.firstname)
                    .replace('%lastname%', userData.lastname)
                    .replace('%email%', userData.email)
                    .replace('%password%', userData.password)
                resolve(data);
            })
            // reject
            .catch(function(err) {
                console.log("Не смоглим прочитать файл: ", err);
            });
    });
}