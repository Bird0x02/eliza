import { Memory } from '@elizaos/core';
import crypto from 'crypto';

function normalizeText(text: string): string {
    return text
        .toLowerCase()           // Convert to lowercase
        .replace(/\s+/g, ' ')   // Replace multiple spaces/newlines with a single space
        .trim();                 // Trim leading and trailing spaces
}

function hashText(text: string): string {
    return crypto.createHash('sha256')
                 .update(text, 'utf8')
                 .digest('hex');
}

export function hashUserMsg(userMsg: Memory, title: string): string {
    const text = normalizeText(userMsg.content.text);
    return hashText(title + ":" + userMsg.agentId + userMsg.roomId + userMsg.userId + text);
}
