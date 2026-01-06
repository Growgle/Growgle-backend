const connectDB = require('../config/connectDB');
const { CreateChatSessionSchema, UpdateChatSessionSchema } = require('../Schema/chatSchema');
const moment = require('moment-timezone');

const db = connectDB();
const COLLECTION_NAME = 'chatSessions';

/**
 * Get all chat sessions for a user
 */
const getChatSessions = async (req, res) => {
    try {
        const userId = req.body?.userId || req.user?.userId;
        console.log('getChatSessions - userId:', userId);
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Query without orderBy to avoid requiring composite index
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('userId', '==', userId)
            .get();

        const sessions = [];
        snapshot.forEach(doc => {
            sessions.push({ id: doc.id, ...doc.data() });
        });

        // Sort by updatedAt in memory
        sessions.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0);
            const dateB = new Date(b.updatedAt || b.createdAt || 0);
            return dateB - dateA;
        });

        console.log('getChatSessions - found sessions:', sessions.length);
        res.json({ success: true, data: sessions });
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get a single chat session by ID
 */
const getChatSession = async (req, res) => {
    try {
        const userId = req.body?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const doc = await db.collection(COLLECTION_NAME).doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Chat session not found' });
        }

        const data = doc.data();
        if (data.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        res.json({ success: true, data: { id: doc.id, ...data } });
    } catch (error) {
        console.error('Error fetching chat session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Create a new chat session
 */
const createChatSession = async (req, res) => {
    try {
        const userId = req.body?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const validationResult = CreateChatSessionSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { title, mode, messages } = validationResult.data;
        const now = moment().tz('Asia/Kolkata').toISOString();

        const sessionData = {
            userId,
            title: title || 'Untitled Chat',
            mode: mode || 'learning',
            createdAt: now,
            updatedAt: now,
            messageCount: messages?.length || 0,
            preview: messages?.[0]?.text?.substring(0, 100) || '',
            lastMessage: messages?.[messages.length - 1]?.text || '',
            messages: messages || [],
        };

        const docRef = await db.collection(COLLECTION_NAME).add(sessionData);

        res.status(201).json({
            success: true,
            data: { id: docRef.id, ...sessionData }
        });
    } catch (error) {
        console.error('Error creating chat session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update an existing chat session
 */
const updateChatSession = async (req, res) => {
    try {
        const userId = req.body?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const docRef = db.collection(COLLECTION_NAME).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Chat session not found' });
        }

        const data = doc.data();
        if (data.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const validationResult = UpdateChatSessionSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const updates = validationResult.data;
        const now = moment().tz('Asia/Kolkata').toISOString();

        const updateData = {
            ...updates,
            updatedAt: now,
        };

        if (updates.messages) {
            updateData.messageCount = updates.messages.length;
            updateData.preview = updates.messages[0]?.text?.substring(0, 100) || data.preview;
            updateData.lastMessage = updates.messages[updates.messages.length - 1]?.text || data.lastMessage;
        }

        await docRef.update(updateData);

        const updated = await docRef.get();
        res.json({ success: true, data: { id: updated.id, ...updated.data() } });
    } catch (error) {
        console.error('Error updating chat session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Delete a chat session
 */
const deleteChatSession = async (req, res) => {
    try {
        const userId = req.body?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const docRef = db.collection(COLLECTION_NAME).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Chat session not found' });
        }

        const data = doc.data();
        if (data.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        await docRef.delete();

        res.json({ success: true, message: 'Chat session deleted' });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getChatSessions,
    getChatSession,
    createChatSession,
    updateChatSession,
    deleteChatSession,
};
