import express from "express"
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { Annotation, MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph"
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
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


const tool = new TavilySearch({
    maxResults: 5,
    topic: "general",
});

const checkPointer=new MemorySaver()

const tools=[tool]

const toolNode=new ToolNode(tools)

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0,   // seriousness of model
    // maxRetries: 2,
}).bindTools(tools)


// using langgraph for realtime data fetching and for using multiple tools

// const State=Annotation.Root({
//     prompt:Annotation,
//     aiMsg:Annotation,
// })





const callLLM=async(state)=>{
    console.log("state",state)
    const response=await llm.invoke([
        {
            role: "system",
            content: `You are Jarvis AI assistant

Use conversation memory first.

Only use tools when the answer requires
external real-time information like:
weather, news, web search, stock prices etc.

Do NOT call tools for simple conversation,
memory-based questions, greetings,
or personal context`
        },
        ...state.messages
    ])
    return {messages:[response]}

}


const shouldContinue=async(state)=>{
const lastMessage=state.messages[state.messages.length-1]
if(lastMessage.tool_calls.length>0){
    return "tools"
}
else{
    return "__end__"
}
}

const graph=new StateGraph(MessagesAnnotation)
.addNode("agent",callLLM)
.addNode("tools",toolNode)
.addEdge("__start__","agent")
.addEdge("agent","__end__")
.addEdge("tools","agent")
.addConditionalEdges("agent",shouldContinue)
.compile({ checkpointer: checkPointer })


app.post("/ai",async(req,res)=>{
    const {input} = req.body
    console.log("hello")
    // const re=await llm.invoke(input)
    // we can define roles as well in langchain
    // const response=await llm.invoke([
    //     {
    //         role:"system",
    //         content:"you are a assistant and your name is jarvis"
    //     },
    //     {
    //         role:"human",
    //         content:input
    //     }
    // ])
    // return res.status(200).json({"ai:":response.content})

    //langgraph
    const response = await graph.invoke(
        {
            messages: [
                {
                    role: "user",
                    content: input
                }
            ]
        },
        {
            configurable: { thread_id: "user123" }
        }
    )
    return res.status(200).json({ "ai:": response.messages[response.messages.length - 1].content })

})


app.listen(Port,()=>{
    console.log(`server started ${Port}`)
})
