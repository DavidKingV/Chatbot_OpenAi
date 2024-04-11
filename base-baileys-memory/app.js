require ('dotenv').config ()

const { createBot, createProvider, createFlow, addKeyword, EVENTS, } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const { init } = require("bot-ws-plugin-openai");
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { handlerAI } = require("./utils");
const { textToVoice } = require("./services/eventlab");
const handlePrompt = require("./services/promptGPT");

const prompt = handlePrompt.handlePrompt();

const OpenAI = require('openai').OpenAI;
const configuration = {
    apiKey: process.env.OPENAI_API_KEY,
}

const employeesAddonConfig = {
  model: "gpt-3.5-turbo",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
};
  
  const employeesAddon = init(employeesAddonConfig);
  
  const flowStaff = addKeyword(EVENTS.ACTION).addAnswer(
    ["Ahi te va compa!"],
    null,
    async (_, { flowDynamic, state }) => {
      console.log("🙉 texto a voz....");
      const currentState = state.getMyState();
      const path = await textToVoice(currentState.answer);
      console.log(`🙉 Fin texto a voz....[PATH]:${path}`);
      await flowDynamic([{ body: "escucha", media: path }]);
    }
  );
  
  const flowVoiceNote = addKeyword(EVENTS.VOICE_NOTE).addAction(
    async (ctx, ctxFn) => {
      await ctxFn.flowDynamic("¡Quihúbole raza, estoy escuchando tu mensaje de voz! 🎙️");
      console.log("🤖 voz a texto....");
      const text = await handlerAI(ctx);
      console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
      const currentState = ctxFn.state.getMyState();
      const fullSentence = `${currentState?.answer ?? ""}. ${text}`;

      const { employee, answer } = await employeesAddon.determine(fullSentence);
      ctxFn.state.update({ answer });
      employeesAddon.gotoFlow(employee, ctxFn);
    }
  );

  const flowText = addKeyword(EVENTS.WELCOME).addAction(
    async (ctx, { flowDynamic}) => {
      
        const openai = new OpenAI(configuration);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: prompt,
                },
                {
                    role: "user",
                    content: ctx.body,
                },
            ],
        });
        const answer = completion.choices[0].message.content;
        await flowDynamic(answer);
    });
   
  
  const main = async () => {
    const adapterDB = new MockAdapter();
  
    const adapterFlow = createFlow([flowVoiceNote, flowStaff, flowText]);
  
    const adapterProvider = createProvider(BaileysProvider);
  
    /**
     * 🤔 Empledos digitales
     * Imaginar cada empleado descrito con sus deberes de manera explicita
     */
    const employees = [
      {
        name: "EMPLEADO_STAFF_TOUR",
        description: prompt,
        flow: flowStaff,
      }
    ];
  
    employeesAddon.employees(employees);
  
    createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });
  
    QRPortalWeb()
    
  };
  
  main();


