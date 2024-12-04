const express = require('express');
const uuid = require('uuid');

module.exports = (redisClient) => {
  const router = express.Router();

  // POST /sessions - Создание сессии
  router.post('/', (req, res) => {
    const sessionId = uuid.v4();
    redisClient.setex(`session:${sessionId}`, process.env.SESSION_TTL, JSON.stringify(req.body));
    res.json({ sessionId });
  });

  // DELETE /sessions/:id - Завершение сессии
  router.delete('/:id', (req, res) => {
    redisClient.del(`session:${req.params.id}`);
    res.status(204).send();
  });

  return router;
};
