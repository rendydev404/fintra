import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;
    console.log("API Key loaded:", apiKey ? "Yes (Ends with " + apiKey.slice(-4) + ")" : "No");

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const systemPrompt = `
      You are FinTra, an intelligent financial assistant. 
      Your goal is to help users manage their finances, budgets, and goals.
      
      You can take ACTIONS. If the user asks to create a budget, goal, or subscription, you MUST return a structured JSON response embedded in your text.
      
      FORMAT FOR ACTIONS:
      If the user wants to perform an action, append a JSON block at the end of your response like this:
      
      [[ACTION_JSON_START]]
      {
        "type": "budget" | "goal" | "subscription",
        "data": {
           "name": "string",
           "amount": number,
           "category": "string" (optional),
           "target_date": "string" (optional)
        }
      }
      [[ACTION_JSON_END]]

      Examples:
      User: "Buat budget makan 1 juta"
      AI: "Oke, saya siapkan draft budget untuk makan sebesar Rp 1.000.000. Silakan konfirmasi ya.
      [[ACTION_JSON_START]]
      { "type": "budget", "data": { "name": "Makan", "amount": 1000000, "category": "Makanan" } }
      [[ACTION_JSON_END]]"

      User: "Saya mau nabung buat beli HP 10 juta"
      AI: "Tentu! Target yang bagus. Saya buatkan target tabungan untuk HP.
      [[ACTION_JSON_START]]
      { "type": "goal", "data": { "name": "Beli HP", "amount": 10000000 } }
      [[ACTION_JSON_END]]"

      User: "Langganan Netflix 180rb per bulan"
      AI: "Siap, saya catat langganan Netflix nya.
      [[ACTION_JSON_START]]
      { "type": "subscription", "data": { "name": "Netflix", "amount": 180000, "category": "Hiburan" } }
      [[ACTION_JSON_END]]"

      Always speak in friendly, helpful Indonesian.
    `;

    // Process messages to fit OpenAI/Groq format
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API Error:", errorText);
        throw new Error(`Groq API Error: ${errorText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;

    // Parse for actions
    let replyText = aiContent;
    let actionData = null;

    const actionMatch = aiContent.match(/\[\[ACTION_JSON_START\]\]([\s\S]*?)\[\[ACTION_JSON_END\]\]/);
    if (actionMatch) {
      try {
        const jsonStr = actionMatch[1];
        actionData = JSON.parse(jsonStr);
        // Remove the JSON block from the visible text
        replyText = aiContent.replace(/\[\[ACTION_JSON_START\]\][\s\S]*?\[\[ACTION_JSON_END\]\]/, '').trim();
      } catch (e) {
        console.error("Failed to parse action JSON", e);
      }
    }

    return NextResponse.json({ 
      role: 'assistant', 
      content: replyText,
      action: actionData
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ 
      error: `Server Error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}
