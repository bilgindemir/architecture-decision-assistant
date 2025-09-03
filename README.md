# Architecture Decision Assistant (ADA)

[![Made with TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8+-brightgreen.svg)](https://pnpm.io/)
[![GitHub Codespaces](https://img.shields.io/badge/Open%20in-Codespaces-blue?logo=github)](https://github.com/codespaces)

AI-powered assistant to draft and manage **Architecture Decision Records (ADRs)**  
using [MADR templates](https://adr.github.io/madr/), [C4 model](https://c4model.com/), and [ISO/IEC/IEEE 42010](https://www.iso.org/standard/74393.html) principles.

---

## ✨ Features
- 📝 Generate new ADRs with **AI-assisted drafting** (OpenAI or AWS Bedrock).  
- 🔍 Index ADRs, docs, and knowledge base for **conflict detection**.  
- 📄 Write ADRs in **MADR template** for consistency.  
- 🖼️ Link decisions with **C4 diagrams** and architecture views.  
- 🔐 Secure workflow with `.env` (keys ignored, `.env.example` committed).  
- 📚 Fully Git-based: PR reviews, versioning, traceability.

---

## ⚙️ Setup

### 1. Clone and open in Codespaces (or local)
```bash
git clone https://github.com/your-org/architecture-decision-assistant.git
cd architecture-decision-assistant

---
