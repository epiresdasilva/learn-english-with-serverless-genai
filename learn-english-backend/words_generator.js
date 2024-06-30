const AWS = require('aws-sdk');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { TextDecoder } = require('util');

const AWS_REGION = "us-east-1";
const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

exports.handler = async (event) => {
    console.log("Invocando o modelo Bedrock para geração de substantivos e traduções...");

    const PROMPT = `Gere uma lista de ${event.prompt} em português, junto com suas traduções em inglês, em formato JSON. Não precisa trazer mais nada de texto além do próprio JSON. Exemplo de retorno: {substantivos: [{ 'português': 'mesa', 'inglês': 'table' },{ 'português': 'cadeira', 'inglês': 'chair' }]}`;

    // Criar uma nova instância do cliente Bedrock
    const client = new BedrockRuntimeClient({ region: AWS_REGION });
    const eventBridge = new AWS.EventBridge();

    // Preparar o payload para o modelo
    const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,  // Ajuste conforme necessário para garantir a geração completa
        messages: [{ role: "user", content: [{ type: "text", text: PROMPT }] }],
    };

    try {
        // Invocar o modelo Bedrock com o payload e aguardar pela resposta
        const apiResponse = await client.send(
            new InvokeModelCommand({
                contentType: "application/json",
                body: JSON.stringify(payload),
                modelId: MODEL_ID,
            })
        );

        const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
        const responseBody = JSON.parse(decodedResponseBody);
        const responses = responseBody.content;

        console.log(`Número de tokens de entrada: ${responseBody.usage.input_tokens}`);
        console.log(`Número de tokens de saída: ${responseBody.usage.output_tokens}`);

        console.log(responses[0].text);
        const palavras = JSON.parse(responses[0].text);
        console.log(palavras);

                // Map the substantivos to EventBridge events
        const eventEntries = palavras.substantivos.map(item => ({
            Source: 'my-application',
            DetailType: 'word-generated',
            Detail: JSON.stringify({
                portugues: item.português,
                ingles: item.inglês
            })
        }));
    
        // Split the eventEntries array into batches of 10
        const batches = [];
        for (let i = 0; i < eventEntries.length; i += 10) {
            batches.push(eventEntries.slice(i, i + 10));
        }

        for (const batch of batches) {
            const params = {
                Entries: batch,
            };

            const result = await eventBridge.putEvents(params).promise();
            console.log('Events sent to EventBridge:', result);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: palavras
        };
    } catch (error) {
        console.error('Erro ao invocar Bedrock ou processar dados:', error);
        return {
            statusCode: 500,
            body: 'Erro ao processar a solicitação'
        };
    }
};