import express from "express"
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

dotenv.config()

const Port=process.env.PORT || 5000

const app=express()

app.use(express.json()) // req.body will return null if we wont include it

app.get("/",(req,res)=>{
    return res.status(200).json({message:`Hello from backend or gateway ${process.env.SERVER_NAME}`})

})
////without langchain
// const ai = new GoogleGenAI({
//     apiKey:process.env.API_KEY
// });


// app.post("/ai",async(req,res)=>{
// const {input}=req.body
// const interaction = await ai.interactions.create({
//   model: "gemini-3.8-flash",
//   input: input,
// });
// res.status(200).json({response:interaction.output_text})
// })

//defining roles

// app.post("/ai/role",async(req,res)=>{
// const {input}=req.body
// const interaction = await ai.interactions.create({
//   model: "gemini-3.8-flash",
//   system_instruction: "You are an assistant named Jarvis.",
//   input,
// });
// res.status(200).json({response:interaction.output_text})
// })

// with langchain

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.8-flash",
    // temperature: 0,
    // maxRetries: 2,
})

app.post("/ai",async(req,res)=>{
    const {input} = req.body
    const response=await llm.invoke(input)
    return res.status(200).json({"ai:":response.content})
})


app.listen(Port,()=>{
    console.log(`server started ${Port}`)
})
