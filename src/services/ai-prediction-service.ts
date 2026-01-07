import { CreateMLCEngine, InitProgressReport, MLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import { Predictions, ReviewData } from "../models/types";

export class AIPredictionService {
    private engine: MLCEngine | null = null;
    private readonly selectedModel = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
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
            const systemPrompt = `You are an expert at creating fun and creative titles and subtitle/descriptions for Azure DevOps team achievements based on statistical data.
            You have to respond only with the title or subtitle/description, without any additional text or explanation.
            Example:
            Title: "More Coffee",
            Subtitle: "Our AI predicts 20% increase in caffeine consumption."`;
            const mainReply = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Based on the following team statistics, provide a creative achievement title and description for the team's performance this year:${JSON.stringify(this.data.stats)}` }
                ],
                temperature: 1.2,
            });
            const subReply = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Based on the following team statistics, provide a creative achievement subtitle/description for the team's performance this year:${JSON.stringify(this.data.stats)}` }
                ],
                temperature: 1.2,
            });
            const mainContent = mainReply.choices[0].message?.content;
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