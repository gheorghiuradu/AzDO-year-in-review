import { ChatCompletionMessageParam, CreateMLCEngine, InitProgressReport, MLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import { Predictions, ReviewData } from "../models/types";

export class AIPredictionService {
    private engine: MLCEngine | null = null;
    private readonly selectedModel = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
    private predictions: Predictions;
    private data: ReviewData;
    constructor(predictions: Predictions, data: ReviewData) {
        this.predictions = predictions;
        this.data = data;
    }

    async initializePredictions() {
        console.log(prebuiltAppConfig.model_list.sort((a, b) => (a.vram_required_MB || 0) - (b.vram_required_MB || 0)));
        if (!this.engine) {
            this.engine = await CreateMLCEngine(
                this.selectedModel,
                { initProgressCallback: this.onInitProgress.bind(this), }, // engineConfig
            );
        }
        try {
            const systemPrompt =
                `You are an expert at creating funny and creative titles and subtitles/descriptions for Azure DevOps team achievement predictions, based on current or historical statistical data.
            - The statistical data will be provided in JSON format, but you should NOT mention JSON in your response and DO NOT respond in JSON format, or include ANY JSON in the responses.
            - DO NOT use markdown formatting.
            - DO NOT include any or phone numbers.
            - DO NOT include the text "Prediction Title" or "Subtitle" in the response.
            - You will be requested for a prediction title only or subtitle only per prompt and have to respond ONLY with the short title OR subtitle/description, without any additional text or explanation.
            - You can sometimes take creative liberties and ignore strict accuracy for the sake of humor and engagement.
            - Your prediction text will be used directly in the slides without any modifications.
            - Avoid repeating the title in the subtitle.
            - Do not repeat the example.

            Example:
            Title: More Coffee,
            Subtitle: Our AI predicts 20% increase in caffeine consumption.`;
            const mainReply = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Based on the following team statistics, provide a prediction title for the team's performance this year:${JSON.stringify(this.data.stats)}` }
                ],
            });
            const mainContent = mainReply.choices[0].message?.content;
            const subReply = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Now create a subtitle/description to go with the prediction title "${mainContent} and the team's performance this year:${JSON.stringify(this.data.stats)}` }
                ],
            });
            const subContent = subReply.choices[0].message?.content;
            console.log('AI Prediction - Main:', mainContent);
            console.log('AI Prediction - Sub:', subContent);
            if (mainContent) {
                this.predictions.mainText = mainContent as string;
            }
            if (subContent) {
                this.predictions.subText = subContent as string;
            }
        } catch (error) {
            console.error('Error generating prediction:', error);
        }
    }

    private async onInitProgress(initProgress: InitProgressReport) {
        console.log(initProgress)
    }
}