# ChatGPT Clone - Modern AI Chat Interface

A sophisticated ChatGPT clone built with Next.js, featuring modern UI design, conversation management, file uploads, and memory integration.

## ✨ Features

### 🎨 Modern UI Design
- **No-bubble chat interface** with clean, modern styling
- **Subtle separators** between messages for better readability
- **Gradient avatars** and enhanced visual hierarchy
- **Response action buttons** (👍 👎 🔄) for user feedback
- **Responsive design** with mobile-friendly sidebar
- **Dark/Light theme support**

### 💬 Chat Functionality
- **Streaming AI responses** with real-time updates
- **Message editing** - Edit and regenerate conversations
- **Conversation management** with persistent storage
- **Token usage tracking** with visual meter
- **Memory integration** (Mem0) for context awareness

### 📁 File Upload Support
- **Multiple file types** - Images, documents, PDFs
- **Cloudinary integration** for cloud storage
- **Drag & drop interface**
- **File preview** with metadata display
- **Attachment bubbles** in chat messages

### 🔧 Technical Features
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **AI SDK** integration for chat functionality
- **Context management** with React hooks
- **LocalStorage** for conversation persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gpt_clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional: Cloudinary for file uploads
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Optional: Mem0 for memory integration
   MEM0_API_KEY=your_mem0_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── AttachmentBubble.tsx
│   ├── FilePreview.tsx
│   ├── FileUpload.tsx
│   ├── NextCloudinaryUpload.tsx
│   └── TokenMeter.tsx
├── contexts/           # React context providers
│   └── ConversationContext.tsx
├── hooks/              # Custom React hooks
│   ├── useFileUpload.ts
│   └── useMemory.ts
├── utils/              # Utility functions
│   ├── conversations.ts
│   ├── mem0Client.ts
│   ├── messageTypes.ts
│   └── tokenUtils.ts
├── api/                # API routes
│   ├── chat/
│   └── sign-cloudinary-params/
├── ChatWindow.tsx      # Main chat interface
├── Sidebar.tsx         # Navigation sidebar
└── page.tsx           # Main application page
```

## 🎯 Key Components

### ChatWindow
- Modern message display without chat bubbles
- Streaming response handling
- File attachment support
- Message editing capabilities
- Response feedback actions

### Sidebar  
- Conversation list with search
- New chat creation
- Conversation management (rename, delete)
- Gradient branding and modern styling

### File Upload System
- Multiple upload methods (drag-drop, button)
- Cloud storage integration
- File type validation
- Preview generation

## 🛠️ Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS Variables
- **AI Integration**: AI SDK, OpenAI GPT-4
- **File Storage**: Cloudinary
- **Memory**: Mem0 integration
- **Icons**: Lucide React
- **Markdown**: React Markdown

## 🔄 Development Workflow

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features
1. Create feature branch
2. Implement changes
3. Test functionality
4. Update documentation
5. Submit pull request

## 🎨 UI/UX Features

- **Clean Modern Design** - Flat interface without chat bubbles
- **Subtle Visual Hierarchy** - Border separators and spacing
- **Interactive Elements** - Hover effects and animations
- **Responsive Layout** - Mobile-first design approach
- **Accessibility** - ARIA labels and keyboard navigation

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY` - Required for AI functionality
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - For file uploads
- `MEM0_API_KEY` - For memory features

### Customization
- Modify `tailwind.config.js` for design system changes
- Update `globals.css` for custom styling
- Configure model settings in components

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for any improvements.

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.

---

Built with ❤️ using Next.js and modern web technologies
