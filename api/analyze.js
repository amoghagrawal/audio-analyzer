export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, messages } = req.body;

    if (!type || !['styles', 'patterns', 'instruments'].includes(type)) {
        return res.status(400).json({ error: 'Invalid or missing analysis type' });
    }

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const prompts = {
        styles: `Analyze this music and return ONLY a JSON object in this exact format (no other text):
        {
          "description": "string",
          "mood": {
            "primary": "string",
            "secondary": ["string"],
            "progression": "string"
          },
          "era": {
            "period": "string",
            "influences": ["string"],
            "context": "string"
          },
          "technicalDetails": {
            "keySignature": "string",
            "tempo": "string",
            "dynamics": "string",
            "production": "string"
          }
        }`,

        patterns: `Return a single JSON object with detailed pattern analysis:
        {
          "description": "string describing overall pattern usage",
          "patterns": [
            {
              "name": "string",
              "type": "string", 
              "description": "string",
              "frequency": "string",
              "confidence": number between 0-1
            }
          ],
          "structure": {
            "form": "string",
            "sections": ["string"],
            "development": "string"
          },
          "techniques": {
            "harmonic": "string",
            "rhythmic": "string",
            "melodic": "string"
          }
        }`,

        instruments: `Analyze the instruments and return ONLY a JSON object in this exact format (no other text):
        {
          "overview": "string describing overall orchestration and arrangement",
          "instruments": [
            {
              "name": "string",
              "icon": "string (emoji)",
              "role": "string",
              "description": "string",
              "confidence": number between 0-1,
              "technique": {
                "playing": "string",
                "effects": ["string"],
                "articulation": "string"
              },
              "characteristics": ["string"],
              "prominence": "string"
            }
          ],
          "orchestration": {
            "balance": "string",
            "texture": "string",
            "layering": "string"
          },
          "harmonicStructure": {
            "progressions": ["string"],
            "voicings": "string",
            "development": "string",
            "chords": [
              {
                "name": "string",
                "type": "string",
                "notes": ["string"],
                "timing": "string",
                "duration": "string"
              }
            ]
          }
        }`,
    };

    const messagesWithPrompt = [
        {
            role: 'system',
            content: 'You are a music analysis AI. Respond with the requested analysis as a JSON object.',
        },
        {
            role: 'user',
            content: prompts[type],
        },
        ...messages,
    ];

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: 'gpt-4', messages: messagesWithPrompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.error.message });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('API call error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}