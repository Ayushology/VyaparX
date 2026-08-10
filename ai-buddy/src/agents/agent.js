const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { ToolMessage, AIMessage } = require("@langchain/core/messages");

const tools = require("./tools");

const toolsList = Object.values(tools);

const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0.5,
}).bindTools(toolsList);

const graph = new StateGraph(MessagesAnnotation)

.addNode("tools", async (state, config) => {

    const lastMessage =
        state.messages[state.messages.length - 1];

    const toolsCall = lastMessage.tool_calls;

    const toolCallResults = await Promise.all(
        toolsCall.map(async (call) => {

            const tool = tools[call.name];

            if (!tool) {
              return new ToolMessage({
                        content: JSON.stringify({ error: `Tool '${call.name}' not found` }),
                        name: call.name,
                        tool_call_id: call.id,
              })
            }

            try{
                    const toolInput = call.args;

            console.log(
                "Invoking tool:",
                call.name,
                "with input:",
                call
            );

            const toolResult = await tool.func({
                ...toolInput,
                token: config.metadata.token || config?.configurable?.token,
            });

            return new ToolMessage({
                content: JSON.stringify(toolResult),
                name: call.name,
                tool_call_id: call.id
            });
            }catch(err){
                console.error(`[AI Buddy] Error in tool '${call.name}':`, err.message);
                    
                    return new ToolMessage({
                        content: JSON.stringify({
                            error: `Failed to execute ${call.name}: ${err.response?.data?.message || err.message}`
                        }),
                        name: call.name,
                        tool_call_id: call.id,
                    });
            }
        
        })
    );

    state.messages.push(...toolCallResults);

    return state;
})

.addNode("chat", async (state) => {

   const response = await model.invoke(state.messages);

    state.messages.push(
        new AIMessage({
            content: response.text,
            tool_calls: response.tool_calls
        })
    );

    return state;
})

.addEdge("__start__", "chat")

.addConditionalEdges("chat", async (state) => {

    const lastMessage =
        state.messages[state.messages.length - 1];

    if (
        lastMessage.tool_calls &&
        lastMessage.tool_calls.length > 0
    ) {
        return "tools";
    }

    return "__end__";
})

.addEdge("tools", "chat");

const agent = graph.compile();

module.exports = agent;