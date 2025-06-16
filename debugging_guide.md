# 🔍 File Upload Debugging Guide

## 🎯 Debug Points Added

We've added comprehensive logging at every critical point in the file upload flow:

### **1. File Processing (useFileUpload.ts)**

```typescript
console.log("🔄 useFileUpload - Processing file:", {
    name: file.name,
    size: file.size,
    type: file.type,
    capabilities,
});
```

### **2. Submit Handler (ChatWindow.tsx)**

```typescript
console.log("🚀 ChatWindow handleSubmit called:", {
    input: input.trim(),
    hasFiles,
    attachments: attachments.length,
    isProcessing,
    status,
});
```

### **3. AI SDK Integration (ChatWindow.tsx)**

```typescript
console.log("📁 Files prepared for AI SDK:", {
    attachmentCount: attachmentList.length,
    attachments: attachmentList.map((a) => ({
        name: a.name,
        contentType: a.contentType,
    })),
});
```

### **4. API Route (route.ts)**

```typescript
console.log("📥 API Route - Received:", {
    model,
    messageCount: messages.length,
    hasAttachments: m.experimental_attachments
        ? m.experimental_attachments.length
        : 0,
});
```

### **5. OpenAI Integration (route.ts)**

```typescript
console.log("📤 API Route - Calling streamText with OpenAI...");
console.log("✅ API Route - streamText created successfully");
```

## 🧪 Testing Steps

### **Test 1: Text-Only Message**

1. Type "Hello" and send
2. **Expected Console Output:**
    ```
    🚀 ChatWindow handleSubmit called: { input: "Hello", hasFiles: false, ... }
    📥 API Route - Received: { model: "gpt-4o", messageCount: 1, ... }
    📤 API Route - Calling streamText with OpenAI...
    ✅ API Route - streamText created successfully
    📥 useChat - onResponse called: { status: 200, ok: true }
    ✅ useChat - onFinish called: { message: "...", usage: {...} }
    ```

### **Test 2: Image Upload**

1. Click paperclip icon
2. Select a small JPG/PNG image
3. Type "What's in this image?"
4. Send message
5. **Expected Console Output:**
    ```
    🔄 useFileUpload - Processing file: { name: "image.jpg", size: 123456, type: "image/jpeg" }
    ✅ File processed successfully: { id: "...", name: "image.jpg", type: "image" }
    🚀 ChatWindow handleSubmit called: { hasFiles: true, attachments: 1 }
    📁 Files prepared for AI SDK: { attachmentCount: 1, attachments: [...] }
    📥 API Route - Received: { hasAttachments: 1 }
    📤 API Route - Calling streamText with OpenAI...
    ✅ API Route - streamText created successfully
    ```

## 🚨 Common Issues to Look For

### **Issue 1: File Processing Failure**

-   **Symptom:** No "✅ File processed successfully" log
-   **Check:** File validation errors, unsupported file types
-   **Fix:** Verify model capabilities, file size limits

### **Issue 2: API Route Not Receiving Attachments**

-   **Symptom:** `hasAttachments: 0` in API logs
-   **Check:** AI SDK attachment format, experimental_attachments property
-   **Fix:** Verify Attachment interface compliance

### **Issue 3: OpenAI API Errors**

-   **Symptom:** "❌ API Route - Error in streamText" logs
-   **Check:** Model permissions, attachment format, API key
-   **Fix:** Verify OpenAI vision model access, content structure

### **Issue 4: Frontend Hanging**

-   **Symptom:** No response after "📤 API Route - Calling streamText"
-   **Check:** OpenAI API timeouts, network issues
-   **Fix:** Check API connectivity, model availability

## 🔧 Debug Commands

### **Check Console Logs:**

```bash
# Open browser dev tools (F12)
# Go to Console tab
# Look for our emoji-prefixed logs
```

### **Check Network Tab:**

```bash
# Open Network tab in dev tools
# Look for POST requests to /api/chat
# Check request payload and response
```

### **Check Terminal Logs:**

```bash
# Check the terminal where npm run dev is running
# Look for API route logs
```

## 🎯 Expected Flow

1. **File Selection** → 🔄 Processing log
2. **File Validation** → ✅ Success log
3. **Submit Click** → 🚀 Submit log
4. **AI SDK Prep** → 📁 Files prepared log
5. **API Call** → 📥 Received log
6. **OpenAI Call** → 📤 Calling log
7. **Success** → ✅ Success log
8. **Response** → 📥 onResponse log
9. **Complete** → ✅ onFinish log

## 🚀 Next Steps

1. **Test with console open** to see all debug logs
2. **Identify where the flow stops** (last visible log)
3. **Check specific error messages** at that point
4. **Fix the identified issue** based on the debugging output

The comprehensive logging will show us exactly where the problem occurs! 🎯
