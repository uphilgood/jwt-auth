require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const posts = [{
    username: 'Phil',
    title: 'post1'
}, {
    username: 'Xtina',
    title: 'post2'
}]

let currentRefreshTokens = [];

const authenticateToken = (req, res, next) => {
    const header = req.headers.authorization;
    const token = header && header.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    })

}

const generateAccessToken = (user) => {
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
    return accessToken;
}

app.get('/posts', authenticateToken, (req, res) => {
    res.json(posts.filter(user => user.username === req.user.name));
})

app.post('/login', (req, res) => {
    // Authenticate user
    const username = req.body.username;
    const user = { name: username }
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    currentRefreshTokens.push(refreshToken);
    res.json({ accessToken, refreshToken })
})

app.post('/refreshToken', (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return res.sendStatus(401);
    if (!currentRefreshTokens.includes(refreshToken)) return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const newAccessToken = generateAccessToken({ name: user.name });
        res.json({ accessToken: newAccessToken, })
    })
})


app.listen(3000)