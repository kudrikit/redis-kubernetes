const redisClient = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

const SESSION_TTL = process.env.SESSION_TTL || 1800;

const createSession = async (req, res) => {
  const sessionId = uuidv4();
  console.log(`Creating session with ID: ${sessionId}`);
  try {
    await redisClient.setex(`session:${sessionId}`, SESSION_TTL, JSON.stringify(req.body));
    console.log(`Session stored in Redis: session:${sessionId}`);
    res.status(201).json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error.message);
    res.status(500).json({ message: error.message });
  }
};


const extendSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const sessionData = await redisClient.get(`session:${sessionId}`);
    if (!sessionData) return res.status(404).json({ message: 'Session not found' });

    await redisClient.expire(`session:${sessionId}`, SESSION_TTL);
    res.status(200).json({ message: 'Session extended' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    await redisClient.del(`session:${sessionId}`);
    res.status(200).json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSession, extendSession, deleteSession };
