
import { GEMINI_API_KEY } from '@env';
import { tarotData } from './data/tarotData';

const MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;


export async function askAI(prompt, opts = {}) {
  if (!GEMINI_API_KEY) throw new Error('Chưa cấu hình GEMINI_API_KEY!');
  try {
    // System prompt: instruct AI to act as Tarot expert, only answer Tarot/life/energy/encouragement, and use tarotData as knowledge base
    const systemPrompt = `Bạn là AI Tarot, chỉ trả lời các câu hỏi về tarot, năng lượng sống, lời khuyên, động viên. Không nên trả lời các chủ đề ngoài tarot à hạn chế trả lời dài nếu người dùng không yêu cầu chi tiết đầy đủ nhé  . Dữ liệu tarot chi tiết như sau (dùng để tra cứu, không liệt kê lại toàn bộ nếu không cần và nếu dài quá tìm mãi không được thì bạn bỏ luôn bạn tìm bằng thông tin của bạn):\n${JSON.stringify(tarotData).slice(0, 12000)}...`;
    const body = {
      contents: [
        { parts: [ { text: systemPrompt } ] },
        { parts: [ { text: opts.prompt || prompt } ] }
      ]
    };
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '(Gemini không trả lời)';
  } catch (err) {
    console.error('AI API error:', err?.message || err);
    throw new Error('Không kết nối được Gemini AI, thử lại sau!');
  }
}
