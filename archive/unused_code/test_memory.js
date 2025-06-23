// Simple test to verify memory functionality
async function testMemoryIntegration() {
    console.log("🧪 Testing memory integration...");
    
    try {
        // Test the API endpoint
        const response = await fetch("http://localhost:3002/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: "Hello, my name is John and I love pizza!"
                    }
                ],
                model: "gpt-4o",
                userId: "test-user-123"
            }),
        });

        console.log("📡 Response status:", response.status);
        
        if (response.ok) {
            console.log("✅ Memory integration appears to be working!");
            
            // Read a small portion of the response
            const reader = response.body?.getReader();
            if (reader) {
                const { value } = await reader.read();
                const chunk = new TextDecoder().decode(value);
                console.log("📄 Response sample:", chunk.substring(0, 200));
            }
        } else {
            console.error("❌ Response failed:", await response.text());
        }
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

testMemoryIntegration();
