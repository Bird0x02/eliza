import { Memory } from '@elizaos/core';
import crypto from 'crypto';

export async function formatObjectsToText(items: any[]): Promise<string> {
  return items
  .map((item, index) => {
    const header = `Item ${index + 1}:\n`;

    const formattedItem = Object.entries(item)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `  ${key}:\n${formatObjectsToText(value)}`;
        } else if (typeof value === "object" && value !== null) {
          return `  ${key}:\n${formatObjectsToText([value])}`;
        }
        return `  ${key}: ${value}`;
      })
      .join("\n");

    return header + formattedItem;
  })
  .join("\n\n");
}


export async function formatObjectToText(data: any): Promise<string> {
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

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
