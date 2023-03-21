import { Answer } from "@/components/Answer/Answer";
import { Navbar } from "@/components/Navbar";
import { IconArrowRight, IconSearch, IconBrandHipchat, IconExternalLink } from "@tabler/icons-react";
import Head from "next/head";
import { useState, useRef } from "react";

export default function Home() {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [gptLoading, setGptLoading] = useState(false);
  const [chunks, setChunks] = useState([]);

  const handleSearch = async () => {
    setAnswer("");
    setChunks([]);
    setLoading(true);
    const searchResponse = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!searchResponse.ok) {
      setLoading(false);
      throw new Error(searchResponse.statusText);
    }

    const results = await searchResponse.json();
    setChunks(results);
    setLoading(false);
    inputRef.current?.focus();
    return results;
  };

  const handleAnswer = async (index) => {
    const { help_url } = chunks[index]
    setAnswer("");
    setGptLoading(true);
    const answerResponse = await fetch("/api/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, url: help_url })
    });
    if (!answerResponse.ok) {
      setGptLoading(false);
      throw new Error(answerResponse.statusText);
    }
    const data = answerResponse.body;
    if (!data) {
      return;
    }
    setGptLoading(false);
    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setAnswer((prev) => prev + chunkValue);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
        handleSearch();
    }
  };

  return (
    <>
      <Head>
        <title>Kintone Asst GPT</title>
        <meta
          name="description"
          content={`AI-powered chat for Kintone Help.`}
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </Head>

      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex h-full w-full max-w-[750px] flex-col items-center px-3 pt-4 sm:pt-8">
              <div className="relative w-full mt-4">
                <IconSearch className="absolute top-3 w-10 left-1 h-6 rounded-full opacity-50 sm:left-3 sm:top-4 sm:h-8" />
                <input
                  ref={inputRef}
                  className="h-12 w-full rounded-full border border-zinc-600 pr-12 pl-11 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 sm:h-16 sm:py-2 sm:pr-16 sm:pl-16 sm:text-lg"
                  type="text"
                  placeholder="How do I start a startup?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <button>
                  <IconArrowRight
                    onClick={handleSearch}
                    className="absolute right-2 top-2.5 h-7 w-7 rounded-full bg-blue-500 p-1 hover:cursor-pointer hover:bg-blue-600 sm:right-3 sm:top-3 sm:h-10 sm:w-10 text-white"
                  />
                </button>
              </div>
            {loading ? (
              <div className="mt-6 w-full">
                <div className="font-bold text-2xl mt-6">Passages</div>
                <div className="animate-pulse mt-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded mt-2"></div>
                  <div className="h-4 bg-gray-300 rounded mt-2"></div>
                  <div className="h-4 bg-gray-300 rounded mt-2"></div>
                  <div className="h-4 bg-gray-300 rounded mt-2"></div>
                </div>
              </div>
            ) : (
              chunks.length > 0 &&
              <div className="mt-6">
                { gptLoading ? (
                  <>
                  <div className="font-bold text-2xl">Answer</div><div className="animate-pulse mt-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded mt-2"></div>
                    <div className="h-4 bg-gray-300 rounded mt-2"></div>
                    <div className="h-4 bg-gray-300 rounded mt-2"></div>
                    <div className="h-4 bg-gray-300 rounded mt-2"></div>
                  </div>
                  </>
                ) : (
                  <>
                  <div className="font-bold text-2xl mb-2">Answer</div>
                  <Answer text={answer} />
                  </>
                )}
                <div className="mt-6 mb-16">
                  <div className="font-bold text-2xl">Passages</div>
                  {chunks.map((chunk, index) => (
                    <div key={index}>
                      <div className="mt-4 border border-zinc-600 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-bold text-xl">{chunk.help_title}</div>
                          </div>
                          <div className="flex">
                            <button>
                              <IconBrandHipchat onClick={ ()=> handleAnswer(index) }/>
                            </button>
                            <a
                              className="hover:opacity-50 ml-2"
                              href={chunk.help_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <IconExternalLink />
                            </a>
                          </div>
                        </div>
                        <div className="mt-2">{chunk.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* <Footer /> */}
      </div>
    </>
  );
}
