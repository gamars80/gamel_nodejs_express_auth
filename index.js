const cookieParser = require('cookie-parser');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
app.use(cookieParser());

const port = 8080;
const secretText = 'superSecret';
const refreshSecretText = 'superRefreshSecret'
const posts = [
    {
        username: 'ddd',
        title: 'post1'
    },
    {
        username:'eeee',
        title:'post2'
    }
]

let refreshTokens = [];

app.post('/login', (req, res) => {
    const userName = req.body.userName;
    const user = {
        name : userName
    }

    //jwt 토큰 생성하기 payload + secret text
    //유효 기간 추가
    const accessToken = jwt.sign(user, secretText, {expiresIn: '30s'});

    //jwt를 이용해 리프레쉬 토큰 생성
    const refreshToken = jwt.sign(user, refreshSecretText, {expiresIn: '1d'});


    //리프레쉬 토큰은 원래같으면 db에 저장하겠지만 일단 배열에 푸시한다
    refreshTokens.push(refreshToken);

    //리프레쉬 토큰을 쿠키에 넣어주기
    res.cookie('jwt',refreshToken, {
        httpOnly: true, //javascript 탈취를 막기위한,
        maxAge: 24 * 60 * 60 * 1000
    })

    res.json({accessToken: accessToken});

})

//토큰 비즈니스를 위한 미들웨어를 넣어준다 authMiddleware
app.get('/posts', authMiddleware, (req,res) => {
    res.json(posts);
})

function authMiddleware(req, res, next) {
    //토큰을 리퀘스트 헤더에서 가져오기
    const authHeader = req.headers['authorization'];
    // Bwarer dsddfde.fdsfdsfdsfdsfww.ddc
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.sendStatus(401);
    
    //토큰이 있으니 유효한 토큰인지 확인한다
    jwt.verify(token, secretText, (err, user) => {
        if(err) return res.sendStatus('403');
        //다음 미들웨어에서 사용하기 위해 넣어줌
        req.user = user;
        next();
    })
}

app.get('/refresh', (req, res) => {
    console.log('req.cookies', req.cookies);
    //cookies 가져오기 cookie-parser
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.sendStatus(403);

    const refreshToken = cookies.jwt;
    // 해당 리프레쉬 토큰이 db에 저장되어 있는지 체크 하지만 일단 db가 없으니 위에 담은 배열에 포함되어 있는지로 대체
    if(!refreshTokens.includes(refreshToken)){
        res.sendStatus(403);
    }

    //토큰이 유효한지 체크
    jwt.verify(refreshToken, refreshSecretText, (err, user) => {
        if(err) return res.sendStatus(403);
        // 유효하니 새로운 어세스 토큰 생성
        const accessToken = jwt.sign({name: user.name}, secretText, {expiresIn: '30s'});

        res.json({accessToken});
    })
})

app.listen(port, () => {
    console.log('Listening on port'+port);

})