import express from 'express'
import { RedisService } from './services/redis.service'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

//const PORT = 8001
RedisService.bIdFetch()

app.listen(process.env.PORT, () => 
    console.log(`[INFO] Server running on port ${process.env.PORT}`)
)

app.get('/', (req, res) => {
    res.status(200).send(`Server Alive!`)
})