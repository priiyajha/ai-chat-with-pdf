const model = ChatOpenAI(
    {
        apiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o",
    }
);