import http from 'http'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { setupSocketAPI } from './services/socket.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { logger } from './services/logger.service.js'
logger.info('server.js loaded...')

const app = express()
const server = http.createServer(app)

// Express App Config
app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
    // Express serve static files on production environment
    app.use(express.static(path.resolve(__dirname, 'public')))
    console.log('__dirname: ', __dirname)
} else {
    // Configuring CORS
    // Make sure origin contains the url 
    // your frontend dev-server is running on
    const corsOptions = {
        origin: [
            // Allow Vite to access the server
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            // Allow the browser to access the server
            'http://127.0.0.1:3030',
            'http://localhost:3030',
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
}

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { postRoutes } from './api/posts/post.routes.js'
import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'

app.use('/api/*', setupAsyncLocalStorage)

// routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)

setupSocketAPI(server)

// Make every unmatched server-side-route fall back to index.html
// So when requesting http://localhost:3030/index.html/car/123 it will still respond with
// our SPA (single page app) (the index.html file) and allow vue-router to take it from there

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const port = process.env.PORT || 3030

server.listen(port, () => {
    logger.info('Server is running on port: ' + port)
})