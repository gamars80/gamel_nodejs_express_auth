const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());

const port = 8080;
const secretText = 'superSecret';
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

app.post('/login', (req, res) => {
    const userName = req.body.userName;
    const user = {
        name : userName
    }

    //jwt 토큰 생성하기 payload + secret text
    const accessToken = jwt.sign(user, secretText);
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

app.listen(port, () => {
    console.log('Listening on port'+port);

})