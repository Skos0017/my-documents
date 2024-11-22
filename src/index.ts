import express, { Request, Response, NextFunction } from 'express';
import cookieParser  from 'cookie-parser';
import { readFilePromise, writeFilePromise } from './file-operator_module'
import { User } from './User'
import { stringify } from 'querystring';


const app = express();
const cookieName = 'Token';


app.use(cookieParser());
app.use(express.json()); // Готов принять JSON
app.use(express.urlencoded({ extended: true })); // Укажите для обработки URL-encoded форм


app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url === '/registration' || req.url === '/registration-page' || req.url === '/login' || req.url === '/enter-page') {
        next();
        return;
    }

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
        readFilePromise('/../enter-page.html')
            .then((page: string) => {
                res.status(200).send(page);
            })
            .catch(next);
        return;
    }

    const parsedCookies: string[] = cookieHeader.split('; ');
    const tokenCookie: string | undefined = parsedCookies.find((cookie: string) => cookie.startsWith('Token='));
    const token: string | undefined = tokenCookie ? tokenCookie.split('=')[1] : undefined;

    if (!token) {
        readFilePromise('/../enter-page.html')
            .then((page: string) => {
                res.status(200).send(page);
            })
            .catch(next);
        return;
    }

    const user: User | undefined = registratedUsers.find((innerUser: User) => innerUser.token === token);

    if (user) {
        replaceTemplateValues('/../main-page.html',user)
            .then((page: string) => {
                res.status(200).send(page);
            })
            .catch(next);
    } else {
        readFilePromise('/../enter-page.html')
            .then((page: string) => {
                res.status(200).send(page);
            })
            .catch(next);
    }
});

let registratedUsers: User[];

function checkRegisteredUsers(req: Request, res: Response, next: NextFunction) {
    let user: User = new User(req.body.user);
    
    if (!req.body.user) {
        res.status(404).send('Ошибка запроса')
        return;
    }

    let findUserByEmail = registratedUsers.find(registratedUser => registratedUser.email === user.email)

    if (findUserByEmail) {
        res.status(401).send('Пользователь с таким email уже зарегистрирован');
        return;
    }
    next();
}

function replaceTemplateValues(fileName: string, userData: User): Promise<string> {
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

function readTemplate(fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        readFilePromise(fileName)
            // resolve
            .then(function(data: string) {
                resolve(data);
            })
            // reject
            .catch(function(err) {
                console.log("Не смоглим прочитать файл: ", err);
            });
    });
}
// так отдавать
app.get('/', (req: Request, res: Response) => {
    readTemplate('/../main-page.html').then(page => {
        res.set('Content-Type', 'text/html')
        .status(200)
        .send(page)
    }).catch(err => {
        console.log(err);
    })
});

app.get('/login', (req: Request, res: Response) => {
    readTemplate('/../enter-page.html').then(page => {
        res.set('Content-Type', 'text/html')
        .status(200)
        .send(page)
    }).catch(err => {
        console.log(err);
    })
});

app.get('/enter-page', (req: Request, res: Response) => {
    readTemplate('/../enter-page.html').then(page => {
        res.set('Content-Type', 'text/html')
        .status(200)
        .send(page)
    }).catch(err => {
        console.log(err);
    })
});

app.get('/registration-page', (req: Request, res: Response) => {
    readTemplate('/../registration-page.html').then(page => {
        res.set('Content-Type', 'text/html')
        .status(200)
        .send(page)
    }).catch(err => {
        console.log(err);
    })
});

app.get('/main-page', (req: Request, res: Response) => {
    readTemplate('/../main-page.html').then(page => {
        res.set('Content-Type', 'text/html')
        .status(200)
        .send(page)
    }).catch(err => {
        console.log(err);
    })
});

app.post('/login',checkRegisteredUsers, function(req: Request, res: Response) {
    // {user: {login,password}}
    let {login, password} = req.body.user;


    readFilePromise('/userData.json')
    .then(function (dataUsers: string) {
        let users: User[] = JSON.parse(dataUsers);
        let userLogin: User | undefined;

        userLogin = users.find((value) => {
            return value.username === login
        })

        if(userLogin === undefined){
            res.status(404);
            res.json({"message": "Пользователь не найден"});
            return;
        }

        if(userLogin.password != password){
            res.status(404);
            res.json({"message": "Логин или Пароль не правельные"});
            return;
        }
       
        res.status(201)
        .cookie('Token', userLogin.token, { httpOnly: true })
        res.json({"message": ''});
       

    })
})

app.post('/registration', checkRegisteredUsers, (req: Request, res: Response) => {
    // {user: {'Name': 'Kas'}}
    let newUser: User = new User(req.body.user);

        readFilePromise('/userData.json')
        .then(dataUsers => {
            let users: User[] = JSON.parse(dataUsers);
            users.push(newUser);

            newUser.setUserToken(generateToken(128, 9));
            registratedUsers.push(newUser);

            return writeFilePromise('/userData.json', JSON.stringify(users, null, 2));
        })
        .then(() => {
            return replaceTemplateValues('/../main-page.html', newUser)
        })
        .then(page => {
            res.set('Content-Type', 'text/html')
                .status(200)
                .cookie('Token', newUser.token, { httpOnly: true })
                .send(page);
        });
});

app.listen(3000, () => {
    readFilePromise('/userData.json')
        .then((data: string) => {
            registratedUsers = JSON.parse(data);

            console.log('Server running on port 3000')
        });
});



// let registratedUsers: User[];

// function checkRegisteredUsers(req: Request, res: Response, next: NextFunction) {
//     let newUser = req.body.user;

//     readFilePromise('/userData.json')
//         .then(data => {
//             let users = JSON.parse(data as string);

//             let userExists = users.some((user: User) => user.email === newUser.email);
//             if (userExists) {
//                 throwErrorPage('RegistrationError')
//                     .then((page) => {
//                         res.set('Content-Type', 'text/html')
//                             .status(200)
//                             .send(page)
//                     });
//             } else {
//                 next();
//             }
//         });
// }

// function replaceTemplateValues(userData: User): Promise<string> {
//     return new Promise((resolve, reject) => {
//         readFilePromise('/index.html')
//             .then((data: string) => {
//                 data = data.replace('%username%', userData.username)
//                     .replace('%firstname%', userData.firstname)
//                     .replace('%lastname%', userData.lastname)
//                     .replace('%email%', userData.email)
//                     .replace('%password%', userData.password)
//                 resolve(data);
//             });
//     });
// }

// function throwErrorPage(message: string) {
//     return new Promise((resolve, reject) => {
//         readFilePromise('/error-page.html')
//             .then(data => {
//                 readFilePromise('/errors.json')
//                     .then(errorJson => {
//                         let errorObj = JSON.parse(errorJson);
//                         data = data.replace('%errormessage%', errorObj[message]);
//                         resolve(data);
//                     });
//             });
//     });
// }

// @length может быть: 64, 128, 256
type cookieLength = 64 | 128 | 256;

function generateToken(length: cookieLength = 128, countSymbolsInBucket: number = 9) {
    let alphabeth: string = 'abcdefghijklmnopqrstuvwxyz';
    let symbolsSet: string = alphabeth + alphabeth.toUpperCase() + '0123456789';

    let token: string = ''
    for (let i = 1; i <= length; i++) {
        if (i % countSymbolsInBucket == 0) {
            token += '-';
            continue;
        }
        let randomIndex = Math.floor(Math.random() * (symbolsSet.length));

        let randomSymbol = symbolsSet[randomIndex];

        token += randomSymbol;
    }

    return token;
}


// // Middleware для обработки JSON-данных
// app.use(express.json());


// // Middleware для обработки URL-кодированных данных
// app.use(express.urlencoded({ extended: true }));

// app.get('/', (req: Request, res: Response) => {
//     const cookieHeader = req.headers.cookie;
//     if (!cookieHeader) {
//         res.status(401).send('Unauthorized');
//         return;
//     }

//     const parsedCookies: string[] = cookieHeader.split('; ');
//     const tokenCookie: string | undefined = parsedCookies.find((cookie: string) => cookie.startsWith('Token='));
//     const token: string | undefined = tokenCookie ? tokenCookie.split('=')[1] : undefined;

//     if (!token) {
//         res.status(401).send('Unauthorized');
//         return;
//     }

//     const user: User | undefined = registratedUsers.find((innerUser: User) => innerUser.token === token);

//     if (!user) {
//         res.status(401).send('Unauthorized');
//         return;
//     }

//     replaceTemplateValues(user)
//         .then((page: string) => {
//             res.set('Content-Type', 'text/html').status(200).send(page);
//         })
//         .catch(err => {
//             res.status(500).send('Internal Server Error');
//         });
// });


// app.get('/registration-page', (req, res) => {
//     readFilePromise('/registration-page.html')
//         .then((data: string) => {
//             res.set('Content-Type', 'text/html')
//                 .status(200)
//                 .send(data);
//         });
// });

// app.post('/registration', checkRegisteredUsers, (req: Request, res: Response) => {
//     let newUser = new User(req.body.user);

//     readFilePromise('/userData.json')
//         .then(data => {
//             let users: User[] = JSON.parse(data);
//             users.push(newUser);
//             newUser.setUserToken(generateToken(128));
//             registratedUsers.push(newUser);

//             return writeFilePromise('/userData.json', JSON.stringify(users, null, 2));
//         })
//         .then(() => {
//             return replaceTemplateValues(newUser)
//         })
//         .then(data => {
//             res.set('Content-Type', 'text/html')
//                 .status(200)
//                 .cookie('Token', newUser.token, { httpOnly: true })
//                 .send(data);
//         });
// });

// app.post('/login', (req, res) => {
//     let newUser = req.body.user;
//     let user: User | undefined;

//     for (let i = 0; i < registratedUsers.length; i++) {
//         if ((newUser.login === registratedUsers[i].username || newUser.login === registratedUsers[i].email)
//             && newUser.password === registratedUsers[i].password) {
//             user = new User(registratedUsers[i]);
//             user.setUserToken(generateToken(128));
//             break;
//         }
//     }

//     if (!user) return throwErrorPage('AuthorizationError');

//     res.set('Location', '/')
//         .status(301)
//         .cookie('Token', user.token, { httpOnly: true })
//         .end();

//     // replaceTemplateValues(user)
//     //     .then((data) => {
//     //         res.set('Location', '/new-path')
//     //             .status(300)
//     //             .cookie('Token', user.token, { httpOnly: true })
//     //             .end();
//     //     });

// });

// app.listen(3000, () => {
//     readFilePromise('/userData.json')
//         .then((data: string) => {
//             registratedUsers = JSON.parse(data);

//             console.log('Server running on port 3000')
//         });
// });