import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { gameName, genre, progress, instruction, insightId } = req.body;
    const { gemini, logger } = req.app.locals;
    
    if (!gameName || !genre || !progress || !instruction) {
      return res.status(400).json({ 
        error: 'Missing required fields: gameName, genre, progress, and instruction are required' 
      });
    }

    logger.info('Processing insights request', {
      gameName,
      genre,
      progress,
      insightId
    });

    // Use Gemini Pro for more detailed insights
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const systemPrompt = `You are Otakon, a master game analyst. Generate detailed, well-formatted markdown content for a specific information tab.

CRITICAL CONTENT RULES:
1. DETAIL AND DEPTH: Provide comprehensive, detailed information
2. STRICT SPOILER-GATING: Only include information relevant to ${progress}% progress
3. CLARITY OVER CRYPTICISM: Be clear and direct about past/present content
4. FRESH CONTENT: Provide new, relevant information based on current progress

FORMATTING RULES:
- Use well-structured Markdown with clear headings (##, ###)
- Use bullet points (- or *) for lists
- Output only the content for the tab, no wrapper objects

Context:
- Game: ${gameName}
- Genre: ${genre}
- Player Progress: ${progress}%
- Insight: ${insightId || 'General Insights'}
- Instruction: ${instruction}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    logger.info('Insights response generated', {
      gameName,
      progress,
      responseLength: text.length
    });

    res.json({ 
      insights: text,
      timestamp: new Date().toISOString(),
      gameName,
      progress
    });
  } catch (error) {
    const logger = req.app.locals.logger;
    logger.error('Insights API error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to generate insights',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as insightsRoutes };
