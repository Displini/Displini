# Environment Variables Template

Copy this content to create your `.env` file in the project root.

```env
# ============================================================================
# Displini Environment Variables
# ============================================================================

# ============================================================================
# Database Configuration (REQUIRED)
# ============================================================================
DATABASE_URL=postgresql://user:password@localhost:5432/displini

# ============================================================================
# Authentication & Security (REQUIRED)
# ============================================================================
SESSION_SECRET=your-random-secret-key-here
JWT_SECRET=your-jwt-secret-here

# ============================================================================
# OpenAI Configuration (OPTIONAL)
# ============================================================================
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4

# ============================================================================
# Server Configuration
# ============================================================================
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# ============================================================================
# Frontend Configuration (Production)
# ============================================================================
# VITE_API_URL=https://api.yourdomain.com
# VITE_PUBLIC_URL=https://yourdomain.com
```

## Quick Setup

1. Copy this file's content
2. Create `.env` in project root
3. Fill in your actual values
4. Never commit `.env` to git!

## Generate Secrets

```bash
# Generate SESSION_SECRET
openssl rand -hex 32

# Generate JWT_SECRET
openssl rand -hex 32
```

