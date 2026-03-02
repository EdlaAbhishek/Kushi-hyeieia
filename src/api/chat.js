export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message required" });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a helpful healthcare AI assistant." },
                    { role: "user", content: message }
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenAI API Error:", data);
            return res.status(response.status).json({ error: data.error?.message || "OpenAI API error", details: data });
        }

        if (!data.choices || data.choices.length === 0) {
            console.error("OpenAI Invalid Response format:", data);
            return res.status(500).json({ error: "Invalid AI response", details: data });
        }

        return res.status(200).json({
            reply: data.choices[0].message.content,
        });
    } catch (error) {
        console.error("Chat API caught exception:", error);
        return res.status(500).json({ error: "AI failed", details: error.message });
    }
}
