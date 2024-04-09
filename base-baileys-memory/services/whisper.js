const fs = require("fs");
const OpenAI = require('openai').OpenAI;

/**
 *
 * @param {*} path url mp3
 */
const voiceToText = async (path) => {
  if (!fs.existsSync(path)) {
    throw new Error("No se encuentra el archivo");
  }

  try {
    const configuration = {
      apiKey: process.env.API_KEY,
  }
    const openai = new OpenAI(configuration);
    const resp = await openai.audio.transcriptions.create({ 
      file: fs.createReadStream(path),
      model:"whisper-1"
    });

    return resp.text;
  } catch (err) {
    console.log(err)
    return "ERROR";
  }
};

module.exports = { voiceToText };
