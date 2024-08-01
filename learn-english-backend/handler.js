const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const fs = require('fs');
const stream = require('stream');

exports.getWord = async (event) => {
  const params = {
    TableName: "Counter",
    Key: { CounterID: "wordCount" }
  };
  
  try {
    const countResult = await dynamoDb.get(params).promise();
    const randomId = Math.floor(Math.random() * countResult.Item.countNumber) + 1;
    const wordParams = {
      TableName: "Palavras",
      Key: { WordID: randomId }
    };
    const wordResult = await dynamoDb.get(wordParams).promise();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
      },
      body: JSON.stringify(wordResult.Item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};

exports.addWord = async (event) => {
  console.log(event);
  console.log(event.Payload);
  
  const payload = event.Payload;
  const word = {
    ...payload[0].body,
    ...payload[1].body
  };

  // Increment the count and update the Counter table
  const updateCounterParams = {
    TableName: "Counter",
    Key: { CounterID: "wordCount" },
    UpdateExpression: "set countNumber = countNumber + :val",
    ExpressionAttributeValues: { ":val": 1 },
    ReturnValues: "UPDATED_NEW"
  };
  const updatedCounterData = await dynamoDb.update(updateCounterParams).promise();
  const newWordID = updatedCounterData.Attributes.countNumber || 0; 

  // Add the word to the Palavras table with the new WordID
  const wordParams = {
    TableName: "Palavras",
    Item: {
      ...word,
      WordID: newWordID
    }
  };
  await dynamoDb.put(wordParams).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'Word added successfully!' })
  };
};

exports.generateImage = async (event) => {
  console.log(event);

  const detail = event.Payload.detail;
  const englishWord = detail.ingles;

  // Create an Amazon Bedrock Runtime client
  const bedrockRuntime = new AWS.BedrockRuntime();

  // Create an Amazon S3 client
  const s3 = new AWS.S3();

  const body = JSON.stringify({
    taskType: 'TEXT_IMAGE',
    textToImageParams: {
      text: `Create a minimalist illustration representing "${englishWord}". The image should be simple and clean, focusing solely on the essential visual elements that symbolize the concept of "${englishWord}". Use a plain white background with colorful accents to highlight the visual representation. Do not include any text or words in the image.`,
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      height: 512,
      width: 512,
      cfgScale: 5.0,
      seed: 0,
    },
  });

  const response = await bedrockRuntime.invokeModel({
    body,
    modelId: 'amazon.titan-image-generator-v1',
    accept: 'application/json',
    contentType: 'application/json',
  }).promise();

  const responseBody = JSON.parse(response.body);

  if (responseBody.error) {
    throw new Error(`Image generation error. Error is ${responseBody.error}`);
  }

  const base64Image = responseBody.images[0];
  const base64Bytes = Buffer.from(base64Image, 'base64');

  // Create a readable stream from the image data
  const imageStream = new stream.Readable();
  imageStream._read = () => {}; // Required to create a readable stream
  imageStream.push(base64Bytes);
  imageStream.push(null); // Signals the end of the stream

  // Define the parameters for the S3 upload
  const s3Params = {
    Bucket: 'learn-english-images',
    Key: `${englishWord}.png`, // Replace with the desired file name in S3
    Body: imageStream,
    ContentType: 'image/png',
  };

  // Upload the image file to S3
  const s3Data = await s3.upload(s3Params).promise();
  const imageUrl = s3Data.Location; // Get the S3 object URL

  const word = {
    ...detail,
    imagePath: imageUrl,
  };

  return {
    body: word,
  };
};


exports.generateAudio = async (event) => {
  console.log(event);

  const detail = event.Payload.detail;
  const portugueseWord = detail.portugues;
  const englishWord = detail.ingles;

  // Create an Amazon Polly client
  const polly = new AWS.Polly();

  // Create an Amazon S3 client
  const s3 = new AWS.S3();

  // Define the parameters for the synthesizeSpeech operation for Portuguese word
  const portugueseParams = {
    Text: portugueseWord,
    OutputFormat: 'mp3',
    VoiceId: 'Camila', // Change to 'Camila' for Brazilian Portuguese
  };

  // Call the synthesizeSpeech method for Portuguese word
  const portugueseData = await polly.synthesizeSpeech(portugueseParams).promise();

  // Create a readable stream from the Portuguese audio data
  const portugueseAudioStream = new stream.Readable();
  portugueseAudioStream._read = () => {}; // Required to create a readable stream
  portugueseAudioStream.push(portugueseData.AudioStream);
  portugueseAudioStream.push(null); // Signals the end of the stream

  const portuguesePassThrough = new stream.PassThrough();
  portugueseAudioStream.pipe(portuguesePassThrough);

  // Define the parameters for the S3 upload for Portuguese audio
  const portugueseS3Params = {
    Bucket: 'learn-english-audios', // Replace with your S3 bucket name
    Key: portugueseWord + '.mp3', // Replace with the desired file name in S3
    Body: portuguesePassThrough,
  };

  // Upload the Portuguese audio file to S3
  const portugueseS3Data = await s3.upload(portugueseS3Params).promise();
  const portugueseAudioPath = portugueseS3Data.Key;

  // Define the parameters for the synthesizeSpeech operation for English word
  const englishParams = {
    Text: englishWord,
    OutputFormat: 'mp3',
    VoiceId: 'Joanna',
  };

  // Call the synthesizeSpeech method for English word
  const englishData = await polly.synthesizeSpeech(englishParams).promise();

  // Create a readable stream from the Portuguese audio data
  const englishAudioStream = new stream.Readable();
  englishAudioStream._read = () => {}; // Required to create a readable stream
  englishAudioStream.push(englishData.AudioStream);
  englishAudioStream.push(null); // Signals the end of the stream

  const englishPassThrough = new stream.PassThrough();
  englishAudioStream.pipe(englishPassThrough);

  // Define the parameters for the S3 upload for English audio
  const englishS3Params = {
    Bucket: 'learn-english-audios', // Replace with your S3 bucket name
    Key: englishWord + '.mp3', // Replace with the desired file name in S3
    Body: englishPassThrough,
  };

  // Upload the English audio file to S3
  const englishS3Data = await s3.upload(englishS3Params).promise();
  const englishAudioPath = englishS3Data.Key;

  const word = {
    ...detail,
    englishAudioPath,
    portugueseAudioPath,
  };

  return {
    body: word
  };
};
