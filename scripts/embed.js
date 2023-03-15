const { Configuration, OpenAIApi } = require("openai");
const { createClient } = require("@supabase/supabase-js");
const { loadEnvConfig } = require("@next/env");

async function embed( openai, chunk ) {
  try {
    const embeddingResponse = await openai.createEmbedding(
      {
        model: "text-embedding-ada-002",
        input: chunk
      });
    const [{ embedding }] = embeddingResponse.data.data;
    return embedding;
  } catch ( error ) {
    console.log("retry", error.toString());
    await new Promise((resolve) => setTimeout(resolve, 1000));
    embed(openai, chunk);
  }
}

(async () => {
    loadEnvConfig(process.cwd());
    const kintone = require('./kintone.json');
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    for (let help of kintone) {
      const { url, title, content } = help;
      for (let chunk of content) {
        const embedding = await embed( openai, chunk );
        const { _, error } = await supabase.from("kintone")
        .insert({
          help_title: title,
          help_url: url,
          content: chunk,
          content_length: chunk.length,
          embedding
        });
        if (error) {
            console.log("error", error);
        } else {
            console.log("saved", title);
        }
      }
    }
})();