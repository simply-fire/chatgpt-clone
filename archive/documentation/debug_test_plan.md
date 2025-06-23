# 🧪 Debug Test Plan

## Phase 1: Text-Only Test (Baseline)

**Goal:** Verify basic chat functionality works before testing file uploads

### Test Steps:

1. Open browser console (F12 → Console tab)
2. Type "Hello" in chat input
3. Click send button
4. Watch console logs

### Expected Debug Output:

```
📊 useChat status changed: ready
🚀 ChatWindow handleSubmit called: { input: "Hello", hasFiles: false, attachments: 0, isProcessing: false, status: "ready" }
📊 useChat status changed: submitted
📥 API Route - Received: { model: "gpt-4o", messageCount: 1, hasAttachments: 0 }
🔧 API Route - After trimming: { model: "gpt-4o", trimmedCount: 1 }
📤 API Route - Calling streamText with OpenAI...
✅ API Route - streamText created successfully
📊 useChat status changed: streaming
📥 useChat - onResponse called: { status: 200, ok: true }
📊 useChat status changed: ready
✅ useChat - onFinish called: { message: "Hello! How can I help you today?...", usage: {...} }
```

## Phase 2: File Upload Test

**Goal:** Test file upload with image

### Test Steps:

1. Click paperclip icon
2. Select a small image (PNG/JPG < 2MB)
3. Verify file appears in preview strip
4. Type "What's in this image?"
5. Click send button
6. Watch console logs

### Expected Debug Output:

```
🔄 useFileUpload - Processing file: { name: "test.jpg", size: 123456, type: "image/jpeg", capabilities: {...} }
✅ File processed successfully: { id: "...", name: "test.jpg", type: "image", hasFile: true }
🚀 ChatWindow handleSubmit called: { input: "What's in this image?", hasFiles: true, attachments: 1, isProcessing: false, status: "ready" }
📁 Files prepared for AI SDK: { attachmentCount: 1, attachments: [{ name: "test.jpg", contentType: "image/jpeg" }] }
📊 useChat status changed: submitted
📥 API Route - Received: { model: "gpt-4o", messageCount: 1, hasAttachments: 1 }
📤 API Route - Calling streamText with OpenAI...
✅ API Route - streamText created successfully
📊 useChat status changed: streaming
📥 useChat - onResponse called: { status: 200, ok: true }
✅ useChat - onFinish called: { message: "I can see an image of...", usage: {...} }
```

## 🚨 Troubleshooting Guide

### Issue: No Submit Log

**Problem:** Button click not working
**Check:** Input validation, disabled states
**Fix:** Verify input.trim() or hasFiles is true

### Issue: No API Route Log

**Problem:** Request not reaching backend
**Check:** Network tab, API endpoint
**Fix:** Verify /api/chat route, check for errors

### Issue: OpenAI Error

**Problem:** API call fails
**Check:** API key, model availability, rate limits
**Fix:** Verify OPENAI_API_KEY, check model permissions

### Issue: No Attachment Processing

**Problem:** File upload not working
**Check:** File validation, model capabilities
**Fix:** Verify file type/size, model supports images

### Issue: Hanging at StreamText

**Problem:** OpenAI API timeout/error
**Check:** Network connectivity, API status
**Fix:** Try smaller file, check OpenAI status page

## 🎯 Ready to Test!

1. **Open http://localhost:3001**
2. **Open browser console (F12)**
3. **Run Phase 1 test first**
4. **If Phase 1 works, run Phase 2**
5. **Report which step fails** with console output

The comprehensive logging will pinpoint exactly where the issue occurs! 🔍
