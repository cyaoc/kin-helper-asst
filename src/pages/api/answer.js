import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import endent from "endent";
import { createParser } from 'eventsource-parser'

loadEnvConfig(process.cwd());

export default async function handler( req, res ) {
  try {
    const { url, query } = req.body
    const input = query.replace(/\n/g, " ");
    const apiKey = process.env.OPENAI_API_KEY;
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from("kintone").select('content').eq('help_url',url);
    if ( error ) {
      throw error;
    }
    const content = endent`
    Use the following passages to provide an answer to the query: "${input}"

    ${data.map((d) => d.content).join("\n")}
    `;
    const ores = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      method: "POST",
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that accurately answers queries using the content available on the kintone help website. Use the text provided to form your answer, but avoid copying word-for-word from the essays. Try to use your own words when possible. Keep your answer under 5 sentences. Be accurate, helpful, concise, and clear."
          },
          {
            role: "user",
            content
          }
        ],
        max_tokens: 150,
        temperature: 0.0,
        stream: true
      })
    });
    if (ores.status !== 200) {
      throw new Error("OpenAI API returned an error");
    }
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const parser = createParser((event) => {
      if (event.type === 'event') {
        const data = event.data;
        if (data === "[DONE]") {
          res.end();
          return;
        }
        const json = JSON.parse(data);
        const text = json.choices[0].delta.content;
        if ( text ) {
          const queue = encoder.encode(text);
          res.write(queue);
        }
      }
    })
    res.status(200);
    for await (const chunk of ores.body) {
      parser.feed(decoder.decode(chunk));
    }
    parser.reset();
  } catch ( error ) {
    console.error(error)
    res.status(500).send(error.message);
  }
}