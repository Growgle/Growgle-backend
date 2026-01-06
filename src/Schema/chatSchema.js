const { z } = require("zod");
const moment = require("moment-timezone");

const ChatMessageSchema = z.object({
    role: z.enum(["user", "ai"]),
    text: z.string(),
    translatedText: z.string().nullable().optional(),
    detectedLanguage: z.string().nullable().optional(),
    files: z.array(z.object({
        name: z.string().optional(),
        url: z.string().optional(),
        type: z.string().optional(),
    })).optional().default([]),
    timestamp: z.string().datetime().optional(),
});

const ChatSessionSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    title: z.string().default("Untitled Chat"),
    mode: z.enum(["learning", "interview", "mentorship", "explore", "roadmap"]).default("learning"),
    createdAt: z.string().datetime().default(() => moment().tz('Asia/Kolkata').toISOString()),
    updatedAt: z.string().datetime().default(() => moment().tz('Asia/Kolkata').toISOString()),
    messageCount: z.number().default(0),
    preview: z.string().default(""),
    lastMessage: z.string().optional(),
    messages: z.array(ChatMessageSchema).optional().default([]),
});

const CreateChatSessionSchema = z.object({
    title: z.string().optional(),
    mode: z.enum(["learning", "interview", "mentorship", "explore", "roadmap"]).optional(),
    messages: z.array(ChatMessageSchema).optional(),
});

const UpdateChatSessionSchema = z.object({
    title: z.string().optional(),
    mode: z.enum(["learning", "interview", "mentorship", "explore", "roadmap"]).optional(),
    messages: z.array(ChatMessageSchema).optional(),
    preview: z.string().optional(),
    lastMessage: z.string().optional(),
});

module.exports = {
    ChatMessageSchema,
    ChatSessionSchema,
    CreateChatSessionSchema,
    UpdateChatSessionSchema,
};
